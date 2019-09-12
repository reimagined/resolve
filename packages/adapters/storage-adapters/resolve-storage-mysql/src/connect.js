const connect = async (pool, { MySQL, escapeId, escape }) => {
  const { tableName, database, ...connectionOptions } = pool.config

  const connection = await MySQL.createConnection({
    ...connectionOptions,
    database,
    multipleStatements: true
  })

  Object.assign(pool, {
    connection,
    tableName,
    escapeId,
    escape,
    database
  })
}

export default connect
