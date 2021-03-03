import type {
  ExternalMethods,
  ReadModelStatus,
  ReadModelRunStatus,
} from './types'

const status: ExternalMethods['status'] = async (pool, readModelName) => {
  const { schemaName, escapeId, escapeStr, inlineLedgerExecuteStatement } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)
  try {
    pool.activePassthrough = true
    const rows = (await inlineLedgerExecuteStatement(
      pool,
      `SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escapeStr(readModelName)}
    `
    )) as Array<{
      Properties: string | null
      SuccessEvent: string | null
      FailedEvent: string | null
      Errors: string | null
      Cursor: string | null
      IsPaused: boolean | null
    }>

    if (rows.length === 1) {
      const result: ReadModelStatus = {
        eventSubscriber: readModelName,
        properties:
          rows[0].Properties != null ? JSON.parse(rows[0].Properties) : null,
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

      return result
    } else {
      return null
    }
  } finally {
    pool.activePassthrough = false
  }
}

export default status
