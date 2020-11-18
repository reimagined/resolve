const deleteProperty = async (pool, readModelName, key) => {
  const { inlineLedgerRunQuery, tablePrefix, escapeId, escape } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  await inlineLedgerRunQuery(
    `UPDATE ${ledgerTableNameAsId}
     SET \`Properties\` = JSON_REMOVE(\`Properties\`, ${escape(key)})
     WHERE \`EventSubscriber\` = ${escape(readModelName)}
    `
  )
}

export default deleteProperty
