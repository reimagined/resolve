import type {
  ExternalMethods,
  ReadModelStatus,
  ReadModelLedger,
  ReadModelRunStatus,
} from './types'

const status: ExternalMethods['status'] = async (pool, readModelName) => {
  const {
    inlineLedgerRunQuery,
    schemaName,
    tablePrefix,
    escapeId,
    escapeStr,
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(
    `${tablePrefix}__${schemaName}__LEDGER__`
  )
  try {
    pool.activePassthrough = true
    const rows = (await inlineLedgerRunQuery(
      `SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escapeStr(readModelName)}
    `
    )) as Array<ReadModelLedger>

    if (rows.length === 1) {
      const result: ReadModelStatus = {
        eventSubscriber: readModelName,
        properties: rows[0].Properties,
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

      return result
    } else {
      return null
    }
  } finally {
    pool.activePassthrough = false
  }
}

export default status
