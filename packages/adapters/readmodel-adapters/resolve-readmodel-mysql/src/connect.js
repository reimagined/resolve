const runQuery = async (pool, querySQL) => {
  const connection = await pool.connectionPromise
  const [rows] = await connection.query(querySQL)
  return rows
}

const setupConnection = async pool => {
  pool.connectionPromise = pool.MySQL.createConnection({
    ...pool.connectionOptions,
    multipleStatements: false
  })
  const connection = await pool.connectionPromise

  connection.onerror = async err => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      return await setupConnection(pool)
    }

    pool.lastMysqlError = err
    // eslint-disable-next-line no-console
    console.warn('SQL error: ', err)
  }
}

const makeNestedPath = nestedPath =>
  `$.${nestedPath.map(JSON.stringify).join('.')}`

const connect = async (imports, pool, options) => {
  let { tablePrefix, ...connectionOptions } = options

  if (
    tablePrefix == null ||
    (tablePrefix != null && tablePrefix.constructor !== String)
  ) {
    tablePrefix = ''
  }

  Object.assign(pool, {
    runQuery: runQuery.bind(null, pool),
    connectionOptions,
    tablePrefix,
    makeNestedPath,
    ...imports
  })

  await setupConnection(pool)
}

export default connect
