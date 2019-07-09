const runRawQuery = async (pool, querySQL) => {
  const connection = await pool.connectionPromise

  const result = await connection.query(querySQL)
  return result
}

const runQuery = async (pool, querySQL) => {
  const [rows] = await runRawQuery(pool, querySQL)
  return rows
}

const setupConnection = async pool => {
  if (pool.isDisconnected) {
    pool.connectionPromise = null
    return
  }
  pool.connectionPromise = pool.MySQL.createConnection({
    ...pool.connectionOptions,
    multipleStatements: true
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
      result += `.${JSON.stringify(part)}`
    }
  }
  return result
}

const connect = async (imports, pool, options) => {
  let { tablePrefix, performanceTracer, ...connectionOptions } = options

  if (
    tablePrefix == null ||
    (tablePrefix != null && tablePrefix.constructor !== String)
  ) {
    tablePrefix = ''
  }

  Object.assign(pool, {
    runRawQuery: runRawQuery.bind(null, pool),
    runQuery: runQuery.bind(null, pool),
    connectionOptions,
    performanceTracer,
    tablePrefix,
    makeNestedPath,
    ...imports
  })

  await setupConnection(pool)
}

export default connect
