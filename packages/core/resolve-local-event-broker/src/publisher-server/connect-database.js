import { SQLITE_BUSY, INTERLOCK_SYMBOL } from './constants'

const randRange = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const fullJitter = retries => randRange(0, Math.min(100, 2 * 2 ** retries))

const coerceEmptyString = obj =>
  (obj != null && obj.constructor !== String) || obj == null ? 'default' : obj

const interlockPromise = async pool => {
  let unlock = null
  while (Promise.resolve(pool[INTERLOCK_SYMBOL]) === pool[INTERLOCK_SYMBOL]) {
    await pool[INTERLOCK_SYMBOL]
  }

  pool[INTERLOCK_SYMBOL] = new Promise(resolve => {
    unlock = () => {
      delete pool[INTERLOCK_SYMBOL]
      resolve()
    }
  })

  return unlock
}

const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`

const escapeStr = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`

const encodeJsonPath = jsonPath =>
  jsonPath
    .replace(/\u001a/g, '\u001aSUB')
    .replace(/"/g, '\u001aQUOTE')
    .replace(/\./g, '\u001aDOT')
    .replace(/\\/g, '\u001aSLASH')

const decodeJsonPath = jsonPath =>
  jsonPath
    .replace(/\u001aSLASH/g, '\\')
    .replace(/\u001aDOT/g, '.')
    .replace(/\u001aQUOTE/g, '"')
    .replace(/\u001aSUB/g, '\u001a')

const emptyTransformer = Function('') // eslint-disable-line no-new-func

const runCommonQuery = async (pool, isRegular, querySQL) => {
  const unlock = await interlockPromise(pool)
  try {
    const executor = isRegular
      ? pool.connection.all.bind(pool.connection)
      : pool.connection.exec.bind(pool.connection)
    const transformer = isRegular ? Array.from.bind(Array) : emptyTransformer
    let result = null

    for (let retry = 0; ; retry++) {
      try {
        result = await executor(querySQL)
        break
      } catch (error) {
        if (error != null && error.code === SQLITE_BUSY) {
          await new Promise(resolve => setTimeout(resolve, fullJitter(retry)))
        } else {
          throw error
        }
      }
    }

    return transformer(result)
  } finally {
    unlock()
  }
}

const disconnect = async pool => {
  if (pool.isDisposed) {
    throw new Error('Event broker SQLite connection already closed')
  }
  pool.isDisposed = true

  await pool.connection.close()
}

const connectDatabase = async (imports, options) => {
  const { SQLite, fs, os, tmp } = imports

  let { databaseFile, ...connectionOptions } = options
  databaseFile = coerceEmptyString(databaseFile)

  const pool = {
    ...imports,
    connectionOptions,
    databaseFile
  }

  const database = {
    runRawQuery: runCommonQuery.bind(null, pool, false),
    runQuery: runCommonQuery.bind(null, pool, true),
    dispose: disconnect.bind(null, pool),
    encodeJsonPath,
    decodeJsonPath,
    escapeId,
    escapeStr
  }

  let connector = null
  if (databaseFile === ':memory:') {
    if (process.env.RESOLVE_LAUNCH_ID != null) {
      const tmpName = `${os.tmpdir()}/event-broker-${+process.env
        .RESOLVE_LAUNCH_ID}.db`
      const removeCallback = () => {
        if (fs.existsSync(tmpName)) {
          fs.unlinkSync(tmpName)
        }
      }

      if (!fs.existsSync(tmpName)) {
        fs.writeFileSync(tmpName, '')
        process.on('SIGINT', removeCallback)
        process.on('SIGTERM', removeCallback)
        process.on('beforeExit', removeCallback)
        process.on('exit', removeCallback)
      }

      pool.memoryStore = {
        name: tmpName,
        drop: removeCallback
      }
    } else if (
      pool.memoryStore == null ||
      Object.keys(pool.memoryStore).length === 0
    ) {
      const temporaryFile = tmp.fileSync()
      pool.memoryStore = {
        name: temporaryFile.name,
        drop: temporaryFile.removeCallback.bind(temporaryFile)
      }
    }

    connector = SQLite.open.bind(SQLite, pool.memoryStore.name)
  } else {
    connector = SQLite.open.bind(SQLite, databaseFile)
  }

  for (let retry = 0; ; retry++) {
    try {
      pool.connection = await connector()
      break
    } catch (error) {
      if (error != null && error.code === SQLITE_BUSY) {
        await new Promise(resolve => setTimeout(resolve, fullJitter(retry)))
      } else {
        throw error
      }
    }
  }

  await database.runRawQuery(`PRAGMA busy_timeout=0`)
  await database.runRawQuery(`PRAGMA locking_mode=EXCLUSIVE`)
  await database.runRawQuery(`PRAGMA encoding=${escapeStr('UTF-8')}`)
  await database.runRawQuery(`PRAGMA synchronous=EXTRA`)

  if (databaseFile === ':memory:') {
    await database.runRawQuery(`PRAGMA journal_mode=MEMORY`)
  } else {
    await database.runRawQuery(`PRAGMA journal_mode=DELETE`)
  }

  await database.runRawQuery(`BEGIN IMMEDIATE`)

  return database
}

export default connectDatabase
