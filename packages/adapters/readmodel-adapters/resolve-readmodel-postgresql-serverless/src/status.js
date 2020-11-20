const status = async (pool, readModelName) => {
  const { schemaName, escapeId, escape, inlineLedgerExecuteStatement } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)

  const rows = await inlineLedgerExecuteStatement(
    pool,
    `SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escape(readModelName)}
    `
  )

  if (rows.length === 1) {
    const result = {
      eventSubscriber: readModelName,
      properties:
        rows[0].Properties != null ? JSON.parse(rows[0].Properties) : null,
      deliveryStrategy: 'inline-ledger',
      successEvent:
        rows[0].SuccessEvent != null ? JSON.parse(rows[0].SuccessEvent) : null,
      failedEvent:
        rows[0].FailedEvent != null ? JSON.parse(rows[0].FailedEvent) : null,
      errors: rows[0].Errors != null ? JSON.parse(rows[0].Errors) : null,
      cursor: rows[0].Cursor != null ? JSON.parse(rows[0].Cursor) : null,
      status: 'deliver',
    }

    if (result.errors != null) {
      result.status = 'error'
    } else if (rows[0].IsPaused) {
      result.status = 'skip'
    }

    return result
  } else {
    return null
  }
}

export default status
