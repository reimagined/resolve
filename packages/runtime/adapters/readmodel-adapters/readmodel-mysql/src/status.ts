import type {
  AdapterOperationStatusMethodArguments,
  AdapterOperationStatusMethodReturnType,
  RuntimeReadModelStatus,
  ExternalMethods,
  ReadModelStatus,
  ReadModelRunStatus,
  ReadModelLedger,
  AdapterPool,
  UnPromise,
} from './types'

const status: ExternalMethods['status'] = async <
  T extends [
    includeRuntimeStatus?: boolean,
    retryTimeoutForRuntimeStatus?: number
  ]
>(
  ...args: AdapterOperationStatusMethodArguments<T, AdapterPool>
): AdapterOperationStatusMethodReturnType<T> => {
  const [
    pool,
    readModelName,
    eventstoreAdapter,
    includeRuntimeStatus,
    retryTimeoutForRuntimeStatus,
  ] = args
  try {
    pool.activePassthrough = true
    const {
      PassthroughError,
      inlineLedgerRunQuery,
      tablePrefix,
      escapeId,
      escapeStr,
    } = pool
    let result: ReadModelStatus | RuntimeReadModelStatus | null = null
    let cursorAndEventTypes: [
      ReadModelLedger['Cursor'],
      Exclude<ReadModelLedger['EventTypes'], null>
    ] = [null, ['*']]

    const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
    const trxTableNameAsId = escapeId(`${tablePrefix}__TRX__`)
    const ledgerTableNameAsStr = escapeStr(`${tablePrefix}__LEDGER__`)

    const rows = (await inlineLedgerRunQuery(
      `SELECT * FROM ${ledgerTableNameAsId}
     WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
    `
    )) as Array<ReadModelLedger>

    if (rows.length === 1) {
      result = {
        eventSubscriber: readModelName,
        deliveryStrategy: 'inline-ledger',
        successEvent: rows[0].SuccessEvent,
        failedEvent: rows[0].FailedEvent,
        errors: rows[0].Errors,
        cursor: rows[0].Cursor,
        status: 'deliver' as ReadModelRunStatus,
      }
      if (result.errors != null) {
        result.status = 'error' as ReadModelRunStatus
      } else if (rows[0].IsPaused) {
        result.status = 'skip' as ReadModelRunStatus
      }

      cursorAndEventTypes = [
        result.cursor,
        rows[0].EventTypes != null ? rows[0].EventTypes : ['*'],
      ]
    }

    if (
      includeRuntimeStatus &&
      result?.status === ('deliver' as ReadModelRunStatus)
    ) {
      let isActive = false
      const endTime =
        Date.now() +
        (retryTimeoutForRuntimeStatus != null
          ? +retryTimeoutForRuntimeStatus
          : 5000)
      for (
        let currentTime = 0;
        currentTime < endTime;
        currentTime = Date.now()
      ) {
        try {
          const rows = (await inlineLedgerRunQuery(
            `SELECT Count(*) AS \`ActiveLocksCount\` FROM performance_schema.data_locks
             WHERE \`OBJECT_SCHEMA\` = DATABASE() AND \`OBJECT_NAME\` = ${ledgerTableNameAsStr}
             AND \`THREAD_ID\` = (
              SELECT \`THREAD_ID\` FROM performance_schema.threads
              WHERE \`PROCESSLIST_ID\` = (
                SELECT CASE WHEN \`T\`.\`XaValue\` IS NOT NULL THEN CAST(\`T\`.\`XaValue\` AS UNSIGNED INTEGER)
                ELSE NULL END FROM ${ledgerTableNameAsId} \`L\`
                LEFT JOIN ${trxTableNameAsId} \`T\` ON \`L\`.\`XaKey\` = \`T\`.\`XaKey\`
                WHERE \`L\`.\`EventSubscriber\` = ${escapeStr(readModelName)}
                AND \`L\`.\`IsPaused\` = FALSE
                AND \`L\`.\`Errors\` IS NULL
                LIMIT 0,1
              )
            );
            `
          )) as Array<{ ActiveLocksCount: number }>

          if (rows?.[0]?.ActiveLocksCount > 0) {
            isActive = true
          }
        } catch (error) {
          if (!(error instanceof PassthroughError)) {
            throw error
          }
        }
      }

      const nextCursor = await eventstoreAdapter.getCursorUntilEventTypes?.(
        ...cursorAndEventTypes
      )
      const hasNextEvents =
        nextCursor != null && nextCursor !== cursorAndEventTypes[0]
      const isAlive = isActive || !hasNextEvents

      result = Object.assign(result, { isAlive })
    } else if (includeRuntimeStatus) {
      const isAlive = result?.status === ('skip' as ReadModelRunStatus)
      result = Object.assign(result, { isAlive })
    }

    return result as UnPromise<AdapterOperationStatusMethodReturnType<T>>
  } finally {
    pool.activePassthrough = false
  }
}

export default status
