const coerceEmptyString = obj =>
  (obj != null && obj.constructor !== String) || obj == null ? 'default' : obj

const connect = async (pool, { sqlite, tmp, os, fs }) => {
  let { databaseFile, tableName, ...initOptions } = pool.config
  const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`
  const escape = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`

  databaseFile = coerceEmptyString(databaseFile)
  tableName = coerceEmptyString(tableName)

  let connector = null
  if (databaseFile === ':memory:') {
    if (process.env.RESOLVE_LAUNCH_ID != null) {
      const tmpName = `${os.tmpdir()}/eventstore-${+process.env
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
    } else {
      const temporaryFile = tmp.fileSync()
      pool.memoryStore = {
        name: temporaryFile.name,
        drop: temporaryFile.removeCallback.bind(temporaryFile)
      }
    }

    connector = sqlite.open.bind(sqlite, pool.memoryStore.name)
  } else {
    connector = sqlite.open.bind(sqlite, databaseFile)
  }

  const database = await connector()
  await database.exec(`PRAGMA busy_timeout=1000000`)
  await database.exec(`PRAGMA encoding=${escape('UTF-8')}`)
  await database.exec(`PRAGMA synchronous=EXTRA`)
  if (databaseFile === ':memory:') {
    await database.exec(`PRAGMA journal_mode=MEMORY`)
  } else {
    await database.exec(`PRAGMA journal_mode=DELETE`)
  }

  Object.assign(pool, {
    database,
    initOptions,
    tableName,
    escapeId,
    escape
  })
}

export default connect
