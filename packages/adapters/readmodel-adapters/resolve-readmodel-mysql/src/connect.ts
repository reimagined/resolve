import type {
  MakeNestedPathMethod,
  CurrentConnectMethod,
  InlineLedgerRunQueryMethod,
  RunQueryMethod,
  AdapterPool,
} from './types'

const runQuery: (
  pool: AdapterPool,
  ...args: Parameters<RunQueryMethod>
) => ReturnType<RunQueryMethod> = async (pool, querySQL) => {
  const [rows] = await pool.connection.query(querySQL)
  return rows as Array<object>
}

const inlineLedgerRunQuery: (
  pool: AdapterPool,
  ...args: Parameters<InlineLedgerRunQueryMethod>
) => ReturnType<InlineLedgerRunQueryMethod> = async (
  pool,
  querySQL,
  passthroughRuntimeErrors = false
) => {
  let rows = null
  try {
    void ([rows] = await pool.connection.query(querySQL))
  } catch (error) {
    if (
      pool.PassthroughError.isPassthroughError(
        error,
        !!passthroughRuntimeErrors
      )
    ) {
      throw new pool.PassthroughError()
    } else {
      throw error
    }
  }

  if (rows != null && Array.isArray(rows)) {
    rows = JSON.parse(JSON.stringify(rows))
  }

  return rows as Array<object>
}

const makeNestedPath: MakeNestedPathMethod = (nestedPath) => {
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

const connect: CurrentConnectMethod = async (imports, pool, options) => {
  let { tablePrefix, ...connectionOptions } = options

  if (
    tablePrefix == null ||
    (tablePrefix != null && tablePrefix.constructor !== String)
  ) {
    tablePrefix = ''
  }

  const connection = await imports.MySQL.createConnection({
    ...connectionOptions,
    multipleStatements: true,
  })

  const [[{ version }]] = (await connection.query(
    `SELECT version() AS \`version\``
  )) as [Array<{ version: string }>, unknown]

  const major = +version.split('.')[0]
  if (isNaN(major) || major < 8) {
    throw new Error(`Supported MySQL version 8+, but got ${version}`)
  }

  Object.assign(pool, {
    inlineLedgerRunQuery: inlineLedgerRunQuery.bind(
      null,
      pool
    ) as InlineLedgerRunQueryMethod,
    runQuery: runQuery.bind(null, pool) as RunQueryMethod,
    tablePrefix,
    makeNestedPath,
    connection,
    ...imports,
  })
}

export default connect
