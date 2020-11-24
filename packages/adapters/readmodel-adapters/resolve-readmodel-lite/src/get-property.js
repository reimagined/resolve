const getProperty = async (pool, readModelName, key) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    tablePrefix,
    fullJitter,
    escapeId,
    escape,
  } = pool
  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  let rows = []

  for (let retry = 0; ; retry++) {
    try {
      await inlineLedgerRunQuery(`BEGIN EXCLUSIVE;`, true)
      rows = await inlineLedgerRunQuery(
        `SELECT json_extract("Properties", ${escape(
          `$.${key
            .replace(/\u001a/g, '\u001a0')
            .replace(/"/g, '\u001a1')
            .replace(/\./g, '\u001a2')}`
        )}) AS "Value"
         FROM  ${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
        `
      )
      await inlineLedgerRunQuery(`COMMIT;`, true)
      break
    } catch (error) {
      if (!(error instanceof PassthroughError)) {
        throw error
      }

      try {
        await inlineLedgerRunQuery(`ROLLBACK`, true)
      } catch (err) {
        if (!(err instanceof PassthroughError)) {
          throw err
        }
      }

      await fullJitter(retry)
    }
  }

  if (rows.length === 1 && rows[0].Value != null) {
    return rows[0].Value
  } else {
    return null
  }
}

export default getProperty
