const setProperty = async (pool, readModelName, key, value) => {
  const { schemaName, escapeId, escape, inlineLedgerExecuteStatement } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)

  await inlineLedgerExecuteStatement(
    pool,
    `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
     SET "Properties" = "Properties" || ${escape(
       JSON.stringify({ [key]: value })
     )}::JSONB 
     WHERE "EventSubscriber" = ${escape(readModelName)}
    `
  )
}

export default setProperty
