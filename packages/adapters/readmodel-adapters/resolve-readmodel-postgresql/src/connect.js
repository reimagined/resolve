const makeNestedPath = (nestedPath) => {
  const jsonPathParts = []
  for (const part of nestedPath) {
    if (part == null || part.constructor !== String) {
      throw new Error('Invalid JSON path')
    }
    if (!isNaN(+part)) {
      jsonPathParts.push(String(+part))
    } else {
      jsonPathParts.push(JSON.stringify(part))
    }
  }
  return `{${jsonPathParts.join(',')}}`
}

const connect = async (imports, pool, options) => {
  let {
    performanceTracer,
    tablePrefix,
    databaseName,
    ...connectionOptions
  } = options

  if (databaseName == null || databaseName.constructor !== String) {
    throw new Error(`Wrong database name: ${databaseName}`)
  }

  if (tablePrefix != null && tablePrefix.constructor !== String) {
    throw new Error(`Wrong table prefix: ${tablePrefix}`)
  } else if (tablePrefix == null) {
    tablePrefix = ''
  }

  const connection = new imports.Postgres({
    user: connectionOptions.user,
    database: connectionOptions.database,
    port: connectionOptions.port,
    host: connectionOptions.host,
    password: connectionOptions.password,
  })

  await connection.connect()
  await connection.query('SELECT 0 AS "defunct"')

  const runQuery = async (sql) => {
    const result = await connection.query(sql)
    let rows = null

    if (result != null && Array.isArray(result.rows)) {
      rows = JSON.parse(JSON.stringify(result.rows))
    }

    return rows
  }

  const inlineLedgerRunQuery = async (
    sql,
    passthroughRuntimeErrors = false
  ) => {
    let result = null
    try {
      result = await connection.query(sql)
    } catch (error) {
      if (
        imports.PassthroughError.isPassthroughError(
          error,
          !!passthroughRuntimeErrors
        )
      ) {
        throw new imports.PassthroughError()
      } else {
        throw error
      }
    }
    let rows = null

    if (result != null && Array.isArray(result.rows)) {
      rows = JSON.parse(JSON.stringify(result.rows))
    }

    return rows
  }

  Object.assign(pool, {
    performanceTracer,
    connectionOptions,
    schemaName: databaseName,
    tablePrefix,
    makeNestedPath,
    transactionId: null,
    readModelName: null,
    inlineLedgerRunQuery,
    runQuery,
    connection,
    ...imports,
  })
}

export default connect
