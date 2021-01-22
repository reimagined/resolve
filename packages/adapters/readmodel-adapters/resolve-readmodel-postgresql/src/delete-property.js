const deleteProperty = async (pool, readModelName, key) => {
  const {
    inlineLedgerRunQuery,
    schemaName,
    tablePrefix,
    escapeId,
    escapeStr,
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(
    `${tablePrefix}__${schemaName}__LEDGER__`
  )

  await inlineLedgerRunQuery(
    `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
     SET "Properties" = "Properties" - ${escapeStr(key)} 
     WHERE "EventSubscriber" = ${escapeStr(readModelName)}
    `
  )
}

export default deleteProperty
