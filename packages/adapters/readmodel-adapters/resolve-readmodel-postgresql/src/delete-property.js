const deleteProperty = async (pool, readModelName, key) => {
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
    pool,
    `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
     SET "Properties" = "Properties" - ${escape(key)} 
     WHERE "EventSubscriber" = ${escape(readModelName)}
    `
  )
}

export default deleteProperty
