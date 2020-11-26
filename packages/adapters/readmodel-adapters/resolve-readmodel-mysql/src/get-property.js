const getProperty = async (pool, readModelName, key) => {
  const { inlineLedgerRunQuery, tablePrefix, escapeId, escape } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  const rows = await inlineLedgerRunQuery(
    `SELECT \`Properties\` -> ${escape(key)} AS \`Value\`
     FROM  ${ledgerTableNameAsId}
     WHERE \`EventSubscriber\` = ${escape(readModelName)}
    `
  )

  if (rows.length === 1 && rows[0].Value != null) {
    return rows[0].Value
  } else {
    return null
  }
}

export default getProperty
