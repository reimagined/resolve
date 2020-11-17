const setProperty = async (pool, readModelName, key, value) => {
  const { inlineLedgerRunQuery, tablePrefix, escapeId, escape } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  await inlineLedgerRunQuery(
    `UPDATE ${ledgerTableNameAsId}
     SET \`Properties\` = JSON_MERGE_PRESERVE(\`Properties\`, CAST(${escape(
       JSON.stringify({ [key]: value })
     )} AS JSON))
     WHERE \`EventSubscriber\` = ${escape(readModelName)}
    `
  )
}

export default setProperty
