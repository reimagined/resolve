const listProperties = async (pool, readModelName) => {
  const {
    PassthroughError,
    fullJitter,
    inlineLedgerRunQuery,
    tablePrefix,
    escapeId,
    escape,
  } = pool
  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  for (let retry = 0; ; retry++) {
    try {
      const rows = await inlineLedgerRunQuery(
        `SELECT "Properties" FROM ${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}`
      )

      const properties =
        rows.length === 1 && rows[0].Properties != null
          ? JSON.parse(rows[0].Properties)
          : null

      if (properties == null) {
        return null
      }

      for (const key of [...Object.keys(properties)]) {
        const nextKey = String(key)
          .replace(/\u001a2/g, '.')
          .replace(/\u001a1/g, '"')
          .replace(/\u001a0/g, '\u001a')
        const value = properties[key]
        delete properties[key]
        properties[nextKey] = value
      }

      return properties
    } catch (error) {
      if (!(error instanceof PassthroughError)) {
        throw error
      }

      await fullJitter(retry)
    }
  }
}

export default listProperties
