import type {
  AdapterOperationStatusMethodArguments,
  AdapterOperationStatusMethodReturnType,
  RuntimeReadModelStatus,
  ExternalMethods,
  ReadModelStatus,
  ReadModelRunStatus,
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
  const [pool, readModelName, eventstoreAdapter, includeRuntimeStatus] = args
  try {
    pool.activePassthrough = true
    const {
      PassthroughError,
      fullJitter,
      inlineLedgerRunQuery,
      tablePrefix,
      escapeId,
      escapeStr,
    } = pool
    const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
    let result: ReadModelStatus | RuntimeReadModelStatus | null = null

    for (let retry = 0; ; retry++) {
      try {
        const rows = (await inlineLedgerRunQuery(
          `SELECT * FROM ${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escapeStr(readModelName)}
        `
        )) as Array<{
          SuccessEvent: string | null
          FailedEvent: string | null
          EventTypes: string | null
          Errors: string | null
          Cursor: string | null
          IsPaused: boolean | null
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
              rows[0].FailedEvent != null
                ? JSON.parse(rows[0].FailedEvent)
                : null,
            errors: rows[0].Errors != null ? JSON.parse(rows[0].Errors) : null,
            cursor: rows[0].Cursor != null ? JSON.parse(rows[0].Cursor) : null,
            status: 'deliver' as ReadModelRunStatus,
          }
          if (result.errors != null) {
            result.status = 'error' as ReadModelRunStatus
          } else if (rows[0].IsPaused) {
            result.status = 'skip' as ReadModelRunStatus
          }
        }
        break
      } catch (error) {
        if (!(error instanceof PassthroughError)) {
          throw error
        }
        await fullJitter(retry)
      }
    }

    // Since SQLite does not provide granular way for ledger seize management,
    // isAlive state is always ambiguous, so force nullish value
    if (includeRuntimeStatus) {
      //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      result = Object.assign(result, { isAlive: null! })
      void eventstoreAdapter
    }

    return result as UnPromise<AdapterOperationStatusMethodReturnType<T>>
  } finally {
    pool.activePassthrough = false
  }
}

export default status
