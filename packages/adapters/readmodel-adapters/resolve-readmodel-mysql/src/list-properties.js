const listProperties = async (pool, readModelName) => {
  const { inlineLedgerRunQuery, tablePrefix, escapeId, escapeStr } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  const rows = await inlineLedgerRunQuery(
    `SELECT \`Properties\`
     FROM  ${ledgerTableNameAsId}
     WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
    `
  )

  if (rows.length === 1) {
    return rows[0].Properties
  } else {
    return null
  }
}

export default listProperties
