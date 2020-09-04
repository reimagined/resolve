const deleteProperty = async (pool, readModelName, key) => {
  const { schemaName, escapeId, escape, inlineLedgerExecuteStatement } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)

  await inlineLedgerExecuteStatement(
    pool,
    `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
     SET "Properties" = "Properties" - ${escape(key)} 
     WHERE "EventSubscriber" = ${escape(readModelName)}
    `
  )
}

export default deleteProperty
