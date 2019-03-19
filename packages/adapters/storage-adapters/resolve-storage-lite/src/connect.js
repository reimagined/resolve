const connect = async (pool, sqlite) => {
  const { databaseFile, tableName, ...initOptions } = pool.config
  const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`
  const escape = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`

  const database = await sqlite.open(databaseFile)
  await database.exec(`PRAGMA encoding=${escape('UTF-8')}`)

  Object.assign(pool, {
    database,
    initOptions,
    tableName,
    escapeId,
    escape
  })
}

export default connect
