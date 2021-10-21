import {
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

const status: ExternalMethods['status'] = async <
  T extends [includeRuntimeStatus?: boolean]
>(
  ...args: AdapterOperationStatusMethodArguments<T, AdapterPool>
): AdapterOperationStatusMethodReturnType<T> => {
  const [pool, readModelName, eventstoreAdapter, includeRuntimeStatus] = args
  try {
    pool.activePassthrough = true
    const {
      PassthroughError,
      schemaName,
      escapeId,
      escapeStr,
      inlineLedgerExecuteStatement,
    } = pool
    let result: ReadModelStatus | RuntimeReadModelStatus | null = null
    let cursorAndEventTypes: [
      ReadModelLedger['Cursor'],
      Exclude<ReadModelLedger['EventTypes'], null>
    ] = [null, ['*']]

    const databaseNameAsId = escapeId(schemaName)
    const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)
    const trxTableNameAsId = escapeId(`__${schemaName}__TRX__`)

    const rows = (await inlineLedgerExecuteStatement(
      pool,
      `SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escapeStr(readModelName)}
    `
    )) as Array<{
      SuccessEvent: string | null
      FailedEvent: string | null
      Errors: string | null
      Cursor: string | null
      IsPaused: boolean | null
      EventTypes: string | null
    }>

    if (rows.length === 1) {
      result = {
        eventSubscriber: readModelName,
        deliveryStrategy: 'inline-ledger',
        successEvent:
          rows[0].SuccessEvent != null
            ? JSON.parse(rows[0].SuccessEvent)
            : null,
        failedEvent:
          rows[0].FailedEvent != null ? JSON.parse(rows[0].FailedEvent) : null,
        errors: rows[0].Errors != null ? JSON.parse(rows[0].Errors) : null,
        cursor: rows[0].Cursor != null ? JSON.parse(rows[0].Cursor) : null,
        status: 'deliver' as ReadModelRunStatus,
      }
      if (result.errors != null) {
        result.status = 'error' as ReadModelRunStatus
      } else if (rows[0].IsPaused) {
        result.status = 'skip' as ReadModelRunStatus
      }

      cursorAndEventTypes = [
        result.cursor,
        rows[0].EventTypes != null ? JSON.parse(rows[0].EventTypes) : ['*'],
      ]
    }

    if (includeRuntimeStatus && result?.status === ReadModelRunStatus.DELIVER) {
      let isActive = false
      const endTime = Date.now() + 5000
      for (
        let currentTime = 0;
        currentTime < endTime;
        currentTime = Date.now()
      ) {
        try {
          const rows = (await inlineLedgerExecuteStatement(
            pool,
            `SELECT "T"."XaValue" AS "TransactionId"
              FROM ${databaseNameAsId}.${ledgerTableNameAsId} "L"
              LEFT JOIN ${databaseNameAsId}.${trxTableNameAsId} "T" ON "L"."XaKey" = "T"."XaKey"
              WHERE "L"."EventSubscriber" = ${escapeStr(readModelName)}
              AND "L"."IsPaused" = FALSE
              AND "L"."Errors" IS NULL
              LIMIT 1;
            `
          )) as Array<{ TransactionId: string }>

          if (rows?.[0]?.TransactionId != null) {
            try {
              await inlineLedgerExecuteStatement(
                pool,
                'SELECT 0',
                rows?.[0]?.TransactionId
              )
              isActive = true
            } catch (e) {}
          }
        } catch (error) {
          if (
            !(error instanceof PassthroughError) ||
            !(error as PassthroughErrorInstance).isRetryable
          ) {
            throw error
          }
        }
      }

      const [nextCursor, endCursor] = await Promise.all([
        eventstoreAdapter.getCursorUntilEventTypes?.(...cursorAndEventTypes),
        eventstoreAdapter.getCursorUntilEventTypes?.(cursorAndEventTypes[0], [
          '*',
        ]),
      ])
      const hasNextEvents = nextCursor != null && nextCursor !== endCursor
      const isAlive = isActive || !hasNextEvents

      result = Object.assign(result, { isAlive })
    } else if (includeRuntimeStatus) {
      const isAlive = result?.status === ReadModelRunStatus.SKIP
      result = Object.assign(result, { isAlive })
    }

    return result as UnPromise<AdapterOperationStatusMethodReturnType<T>>
  } finally {
    pool.activePassthrough = false
  }
}

export default status
