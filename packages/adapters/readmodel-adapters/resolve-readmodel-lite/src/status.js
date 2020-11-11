const status = async (pool, readModelName) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    tablePrefix,
    escapeId,
    escape,
  } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  while (true) {
    try {
      const rows = await inlineLedgerRunQuery(
        `SELECT * FROM ${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escape(readModelName)}
    `
      )

      if (rows.length === 1) {
        const result = {
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
    } catch (err) {
      if (!(err instanceof PassthroughError)) {
        throw err
      }
    }
  }
}

export default status
