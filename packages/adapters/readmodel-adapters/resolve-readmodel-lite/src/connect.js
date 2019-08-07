const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`
const escape = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`
const coerceEmptyString = obj =>
  (obj != null && obj.constructor !== String) || obj == null ? 'default' : obj
const emptyTransformer = Function('') // eslint-disable-line no-new-func
const SQLITE_BUSY = 'SQLITE_BUSY'

const randRange = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min
const fullJitter = retries => randRange(0, Math.min(100, 2 * 2 ** retries))

const runCommonQuery = async (pool, isRegular, querySQL) => {
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
}

const makeNestedPath = nestedPath => {
  let result = '$'
  for (const part of nestedPath) {
    if (part == null || part.constructor !== String) {
      throw new Error('Invalid JSON path')
    }
    const invariant = Number(part)
    if (!isNaN(invariant)) {
      result += `[${invariant}]`
    } else {
      result += `.${part
        .replace(/\u001a/g, '\u001a0')
        .replace(/"/g, '\u001a1')
        .replace(/\./g, '\u001a2')}`
    }
  }

  return result
}

const connect = async (imports, pool, options) => {
  let {
    tablePrefix,
    databaseFile,
    performanceTracer,
    ...connectionOptions
  } = options
  tablePrefix = coerceEmptyString(tablePrefix)
  databaseFile = coerceEmptyString(databaseFile)

  Object.assign(pool, {
    runRawQuery: runCommonQuery.bind(null, pool, false),
    runQuery: runCommonQuery.bind(null, pool, true),
    connectionOptions,
    performanceTracer,
    tablePrefix,
    databaseFile,
    makeNestedPath,
    escapeId,
    escape,
    ...imports
  })

  let connector = null
  if (databaseFile === ':memory:') {
    if (Object.keys(pool.memoryStore).length === 0) {
      const temporaryFile = imports.tmp.fileSync()
      Object.assign(pool.memoryStore, {
        ...temporaryFile,
        drop: temporaryFile.removeCallback.bind(temporaryFile)
      })
    }
    connector = imports.SQLite.open.bind(imports.SQLite, pool.memoryStore.name)
  } else {
    connector = imports.SQLite.open.bind(imports.SQLite, databaseFile)
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

  await pool.runRawQuery(`PRAGMA busy_timeout=0`)
  await pool.runRawQuery(`PRAGMA encoding=${escape('UTF-8')}`)
  await pool.runRawQuery(`PRAGMA synchronous=EXTRA`)

  if (databaseFile === ':memory:') {
    await pool.runRawQuery(`PRAGMA journal_mode=MEMORY`)
  } else {
    await pool.runRawQuery(`PRAGMA journal_mode=DELETE`)
  }
}

export default connect
