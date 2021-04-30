import type {
  MakeNestedPathMethod,
  CurrentConnectMethod,
  InlineLedgerRunQueryMethod,
  AdapterPool,
} from './types'

const inlineLedgerRunQuery: (
  pool: AdapterPool,
  ...args: Parameters<InlineLedgerRunQueryMethod>
) => ReturnType<InlineLedgerRunQueryMethod> = async (
  pool,
  querySQL,
  passthroughRuntimeErrors = false
) => {
  const connection = pool.distinctMode
    ? await pool.getConnection()
    : pool.connection

  try {
    let rows = null
    for (;;) {
      try {
        void ([rows] = await connection.query(querySQL))
        break
      } catch (error) {
        if (pool.activePassthrough) {
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
        } else {
          if (pool.PassthroughError.isPassthroughError(error, false)) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          } else {
            throw error
          }
        }
      }
    }

    if (rows != null && Array.isArray(rows)) {
      rows = JSON.parse(JSON.stringify(rows))
    }

    return rows as Array<object>
  } finally {
    if (pool.distinctMode) {
      await connection.end()
    }
  }
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

  const getConnection = async () => {
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

    return connection
  }

  Object.assign(pool, {
    inlineLedgerRunQuery: inlineLedgerRunQuery.bind(
      null,
      pool
    ) as InlineLedgerRunQueryMethod,
    connection: await getConnection(),
    activePassthrough: false,
    distinctMode: false,
    tablePrefix,
    makeNestedPath,
    getConnection,
    ...imports,
  })
}

export default connect
