const getProperty = async (pool, readModelName, key) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    tablePrefix,
    escapeId,
    escape,
  } = pool
  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  let rows = []

  while (true) {
    try {
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
      break
    } catch (error) {
      if (!(error instanceof PassthroughError)) {
        throw error
      }
    }
  }

  if (rows.length === 1 && rows[0].Value != null) {
    return rows[0].Value
  } else {
    return null
  }
}

export default getProperty
