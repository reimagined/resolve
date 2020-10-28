const setProperty = async (pool, readModelName, key, value) => {
  const {
    inlineLedgerRunQuery,
    schemaName,
    tablePrefix,
    escapeId,
    escape,
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(
    `${tablePrefix}__${schemaName}__LEDGER__`
  )

  await inlineLedgerRunQuery(
    `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
     SET "Properties" = "Properties" || ${escape(
       JSON.stringify({ [key]: value })
     )}::JSONB 
     WHERE "EventSubscriber" = ${escape(readModelName)}
    `
  )
}

export default setProperty
