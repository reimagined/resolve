const listProperties = async (pool, readModelName) => {
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

  const rows = await inlineLedgerRunQuery(
    `SELECT "Properties"
     FROM  ${databaseNameAsId}.${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escape(readModelName)}
    `
  )

  if (rows.length === 1) {
    return rows[0].Properties
  } else {
    return null
  }
}

export default listProperties
