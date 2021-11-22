import type {
  CurrentConnectMethod,
  InlineLedgerRunQueryMethod,
  AdapterPool,
  CommonAdapterPool,
  OmitObject,
} from './types'

const connect: CurrentConnectMethod = async (imports, pool, options) => {
  let { tablePrefix, databaseName, buildMode, ...connectionOptions } = options

  if (databaseName == null || databaseName.constructor !== String) {
    throw new Error(`Wrong database name: ${databaseName}`)
  }

  if (tablePrefix != null && tablePrefix.constructor !== String) {
    throw new Error(`Wrong table prefix: ${tablePrefix}`)
  } else if (tablePrefix == null) {
    tablePrefix = ''
  }

  if (buildMode != null && !['auto', 'plv8', 'nodejs'].includes(buildMode)) {
    throw new Error(`Wrong build mode: ${buildMode}`)
  } else if (buildMode == null) {
    buildMode = 'auto'
  }

  const connectionErrorsMap: WeakMap<
    typeof pool.connection,
    Array<Error>
  > = new WeakMap()
  const connectPromiseMap: WeakMap<
    typeof pool.connection,
    Promise<void>
  > = new WeakMap()

  const establishConnection = async () => {
    if (pool.connection != null) {
      const connection = pool.connection
      await connectPromiseMap.get(connection)
      return connection
    }
    const connection = new imports.Postgres(connectionOptions)
    pool.connection = connection
    connectPromiseMap.set(
      connection,
      (async () => {
        await Promise.resolve()
        connectionErrorsMap.set(connection, [])
        try {
          connection.on('error', (error) => {
            connectionErrorsMap.get(connection)?.push(error)
          })
          await connection.connect()
          await connection.query('SELECT 0 AS "defunct"')
        } catch (error) {
          connectionErrorsMap.get(connection)?.push(error)
        }
      })()
    )
    await connectPromiseMap.get(connection)
    return connection
  }

  const maybeThrowConnectionErrors = async (
    connection: typeof pool.connection
  ) => {
    const connectionErrors = connectionErrorsMap.get(connection) ?? []
    if (connectionErrors.length > 0) {
      let summaryError = connectionErrors[0]
      if (connectionErrors.length > 1) {
        summaryError = new Error(
          connectionErrors.map(({ message }) => message).join('\n')
        )
        summaryError.stack = connectionErrors
          .map(({ stack }) => stack)
          .join('\n')
      }
      if (pool.connection === connection) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        pool.connection = null!
      }
      try {
        await connection.end()
      } catch (err) {}
      throw summaryError
    }
  }

  const initialConnection = await establishConnection()
  await maybeThrowConnectionErrors(initialConnection)

  const inlineLedgerRunQuery: InlineLedgerRunQueryMethod = async (
    sql,
    passthroughRuntimeErrors = false
  ) => {
    let result = null
    for (;;) {
      try {
        const connection = await establishConnection()
        await maybeThrowConnectionErrors(connection)
        result = await connection.query(sql)
        break
      } catch (error) {
        if (pool.activePassthrough) {
          if (
            imports.PassthroughError.isPassthroughError(
              error,
              !!passthroughRuntimeErrors
            )
          ) {
            imports.PassthroughError.maybeThrowPassthroughError(
              error,
              !!passthroughRuntimeErrors
            )
          } else {
            throw error
          }
        } else {
          if (imports.PassthroughError.isPassthroughError(error, false)) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          } else {
            throw error
          }
        }
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
    inlineLedgerRunQuery,
    connection: initialConnection,
    activePassthrough: false,
    buildMode,
    ...imports,
  })
}

export default connect
