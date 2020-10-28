const deleteProperty = async (pool, readModelName, key) => {
  const { schemaName, tablePrefix, escapeId, escape, inlineLedgerRunQuery } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`${tablePrefix}__${schemaName}__LEDGER__`)

  await inlineLedgerExecuteStatement(
    pool,
    `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
     SET "Properties" = "Properties" - ${escape(key)} 
     WHERE "EventSubscriber" = ${escape(readModelName)}
    `
  )
}

export default deleteProperty
