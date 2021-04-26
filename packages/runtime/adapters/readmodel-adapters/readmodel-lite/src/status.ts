import type {
  ExternalMethods,
  ReadModelStatus,
  ReadModelRunStatus,
} from './types'

const status: ExternalMethods['status'] = async (pool, readModelName) => {
  const {
    PassthroughError,
    fullJitter,
    inlineLedgerRunQuery,
    tablePrefix,
    escapeId,
    escapeStr,
  } = pool
  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  try {
    pool.activePassthrough = true
    for (let retry = 0; ; retry++) {
      try {
        const rows = (await inlineLedgerRunQuery(
          `SELECT * FROM ${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escapeStr(readModelName)}
        `
        )) as Array<{
          SuccessEvent: string | null
          FailedEvent: string | null
          Errors: string | null
          Cursor: string | null
          IsPaused: boolean | null
        }>

        if (rows.length === 1) {
          const result: ReadModelStatus = {
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

          return result
        } else {
          return null
        }
      } catch (error) {
        if (!(error instanceof PassthroughError)) {
          throw error
        }

        await fullJitter(retry)
      }
    }
  } finally {
    pool.activePassthrough = false
  }
}

export default status
