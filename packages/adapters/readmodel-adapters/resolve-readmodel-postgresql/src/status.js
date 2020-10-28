const status = async (pool, readModelName) => {
  const {
    inlineLedgerRunQuery,
    schemaName,
    tablePrefix,
    escapeId,
    escape,
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(
    `${tablePrefix}__${schemaName}__LEDGER__`
  )

  const rows = await inlineLedgerRunQuery(
    `SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escape(readModelName)}
    `
  )

  if (rows.length === 1) {
    const result = {
      successEvent: JSON.parse(rows[0].SuccessEvent),
      failedEvent: JSON.parse(rows[0].FailedEvent),
      errors: JSON.parse(rows[0].Errors),
      cursor: JSON.parse(rows[0].Cursor),
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
