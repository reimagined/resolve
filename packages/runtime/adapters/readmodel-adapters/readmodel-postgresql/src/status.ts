import type {
  AdapterOperationStatusMethodArguments,
  AdapterOperationStatusMethodReturnType,
  RuntimeReadModelStatus,
  PassthroughErrorInstance,
  ExternalMethods,
  ReadModelStatus,
  ReadModelRunStatus,
  ReadModelLedger,
  AdapterPool,
  UnPromise,
} from './types'

const IS_ALIVE_TIMEOUT = 20000

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
    let result: ReadModelStatus | RuntimeReadModelStatus | null = null

    const {
      PassthroughError,
      inlineLedgerRunQuery,
      schemaName,
      tablePrefix,
      escapeId,
      escapeStr,
    } = pool

    const databaseNameAsId = escapeId(schemaName)
    const databaseNameAsStr = escapeStr(schemaName)
    const ledgerTableNameAsId = escapeId(
      `${tablePrefix}__${schemaName}__LEDGER__`
    )
    const trxTableNameAsId = escapeId(`${tablePrefix}__${schemaName}__TRX__`)
    const ledgerTableNameAsStr = escapeStr(
      `${tablePrefix}__${schemaName}__LEDGER__`
    )

    await pool.ensureAffectedOperation('status', readModelName)
    const rows = (await inlineLedgerRunQuery(
      `SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escapeStr(readModelName)}
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
    }

    if (
      includeRuntimeStatus &&
      result?.status === ('deliver' as ReadModelRunStatus)
    ) {
      let isAlive: boolean | null = false

      const endTime =
        Date.now() +
        (retryTimeoutForRuntimeStatus != null
          ? +retryTimeoutForRuntimeStatus
          : IS_ALIVE_TIMEOUT)
      let currentTime = 0
      let previousCursor = null

      do {
        try {
          const [lockRows, subscriberRows] = await Promise.all([
            inlineLedgerRunQuery(
              `SELECT Count(*) AS "ActiveLocksCount" FROM pg_locks
              WHERE database = (SELECT oid FROM pg_database WHERE datname = current_database())
              AND relation = (SELECT oid FROM pg_class WHERE relname = ${ledgerTableNameAsStr}
              AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = ${databaseNameAsStr}))
              AND pid = (
                SELECT CASE WHEN "T"."XaValue" IS NOT NULL THEN CAST("T"."XaValue" AS INT)
                ELSE NULL END FROM ${databaseNameAsId}.${ledgerTableNameAsId} "L"
                LEFT JOIN ${databaseNameAsId}.${trxTableNameAsId} "T" ON "L"."XaKey" = "T"."XaKey"
                WHERE "L"."EventSubscriber" = ${escapeStr(readModelName)}
                AND "L"."IsPaused" = FALSE
                AND "L"."Errors" IS NULL
                LIMIT 1
              );`
            ) as Promise<Array<{ ActiveLocksCount: number }>>,
            inlineLedgerRunQuery(
              `SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
               WHERE "EventSubscriber" = ${escapeStr(readModelName)}
              `
            ) as Promise<Array<ReadModelLedger>>,
          ])

          if (lockRows?.[0]?.ActiveLocksCount > 0) {
            isAlive = true
          }

          if (!isAlive && subscriberRows.length === 1) {
            let [{ Cursor, EventTypes }] = subscriberRows

            if (EventTypes == null) {
              EventTypes = ['*']
            }

            const [nextCursor, endCursor] = await Promise.all([
              eventstoreAdapter.getCursorUntilEventTypes?.(Cursor, EventTypes),
              eventstoreAdapter.getCursorUntilEventTypes?.(Cursor, ['*']),
            ])

            isAlive = nextCursor == null || nextCursor === endCursor

            if (previousCursor != null && Cursor !== previousCursor) {
              isAlive = true
            }
            previousCursor = Cursor
          }
        } catch (error) {
          if (
            !(error instanceof PassthroughError) ||
            !(error as PassthroughErrorInstance).isRetryable
          ) {
            throw error
          }

          isAlive = null
        }

        currentTime = Date.now()
      } while (!isAlive && currentTime < endTime)

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
