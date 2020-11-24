const listProperties = async (pool, readModelName) => {
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
        `SELECT "Properties" FROM  ${ledgerTableNameAsId}
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

  if (rows.length === 1) {
    const properties =
      rows[0].Properties != null ? JSON.parse(rows[0].Properties) : null
    for (const key of Object.keys(properties)) {
      properties[
        String(key)
          .replace(/\u001a2/g, '.')
          .replace(/\u001a1/g, '"')
          .replace(/\u001a0/g, '\u001a')
      ] = properties[key]

      delete properties[key]
    }
    return properties
  } else {
    return null
  }
}

export default listProperties
