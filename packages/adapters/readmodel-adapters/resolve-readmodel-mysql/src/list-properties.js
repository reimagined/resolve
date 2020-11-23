const listProperties = async (pool, readModelName) => {
  const { inlineLedgerRunQuery, tablePrefix, escapeId, escape } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  const rows = await inlineLedgerRunQuery(
    `SELECT \`Properties\`
     FROM  ${ledgerTableNameAsId}
     WHERE \`EventSubscriber\` = ${escape(readModelName)}
    `
  )

  if (rows.length === 1) {
    return rows[0].Properties
  } else {
    return null
  }
}

export default listProperties
