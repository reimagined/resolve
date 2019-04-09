const coerceEmptyString = obj =>
  (obj != null && obj.constructor !== String) || obj == null ? 'default' : obj

const connect = async (pool, sqlite) => {
  let { databaseFile, tableName, ...initOptions } = pool.config
  const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`
  const escape = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`

  databaseFile = coerceEmptyString(databaseFile)
  tableName = coerceEmptyString(tableName)

  const database = await sqlite.open(databaseFile)
  await database.exec(`PRAGMA encoding=${escape('UTF-8')}`)
  await database.exec(`PRAGMA synchronous = NORMAL`)
  await database.configure('busyTimeout', 1000000)

  Object.assign(pool, {
    database,
    initOptions,
    tableName,
    escapeId,
    escape
  })
}

export default connect
