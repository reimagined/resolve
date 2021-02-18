import type {
  MakeNestedPathMethod,
  CurrentConnectMethod,
  InlineLedgerRunQueryMethod,
  RunQueryMethod,
  AdapterPool,
  CommonAdapterPool,
  OmitObject,
} from './types'

const makeNestedPath: MakeNestedPathMethod = (nestedPath) => {
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

const connect: CurrentConnectMethod = async (imports, pool, options) => {
  let { tablePrefix, databaseName, ...connectionOptions } = options

  if (databaseName == null || databaseName.constructor !== String) {
    throw new Error(`Wrong database name: ${databaseName}`)
  }

  if (tablePrefix != null && tablePrefix.constructor !== String) {
    throw new Error(`Wrong table prefix: ${tablePrefix}`)
  } else if (tablePrefix == null) {
    tablePrefix = ''
  }

  const connection = new imports.Postgres(connectionOptions)

  await connection.connect()
  await connection.query('SELECT 0 AS "defunct"')

  const runQuery: RunQueryMethod = async (sql) => {
    const result = await connection.query(sql)
    let rows = null

    if (result != null && Array.isArray(result.rows)) {
      rows = JSON.parse(JSON.stringify(result.rows))
    }

    return rows
  }

  const inlineLedgerRunQuery: InlineLedgerRunQueryMethod = async (
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

  Object.assign<
    OmitObject<AdapterPool, CommonAdapterPool>,
    OmitObject<AdapterPool, CommonAdapterPool>
  >(pool, {
    schemaName: databaseName,
    tablePrefix,
    makeNestedPath,
    inlineLedgerRunQuery,
    runQuery,
    connection,
    ...imports,
  })
}

export default connect
