const status = async (pool, readModelName) => {
  const { inlineLedgerRunQuery, tablePrefix, escapeId, escape } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  const rows = await inlineLedgerRunQuery(
    `SELECT * FROM ${ledgerTableNameAsId}
     WHERE \`EventSubscriber\` = ${escape(readModelName)}
    `
  )

  if (rows.length === 1) {
    const result = {
      successEvent: rows[0].SuccessEvent,
      failedEvent: rows[0].FailedEvent,
      errors: rows[0].Errors,
      cursor: rows[0].Cursor,
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
