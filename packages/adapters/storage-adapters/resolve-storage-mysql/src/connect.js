const connect = async (pool, { MySQL, escapeId, escape }) => {
  const { tableName, ...connectionOptions } = pool.config

  const connection = await MySQL.createConnection(connectionOptions)

  Object.assign(pool, {
    connection,
    tableName,
    escapeId,
    escape
  })
}

export default connect
