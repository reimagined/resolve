const listProperties = async (pool, readModelName) => {
  const { inlineLedgerRunQuery, tablePrefix, escapeId, escape } = pool
  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  const rows = await inlineLedgerRunQuery(
    `SELECT "Properties" FROM  ${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
        `
  )

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
