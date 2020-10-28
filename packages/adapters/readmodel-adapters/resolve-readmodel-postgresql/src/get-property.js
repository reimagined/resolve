const getProperty = async (pool, readModelName, key) => {
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
    `SELECT "Properties" -> ${escape(key)} AS "Value"
     FROM  ${databaseNameAsId}.${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escape(readModelName)}
    `
  )

  if (rows.length === 1 && rows[0].Value != null) {
    return rows[0].Value
  } else {
    return null
  }
}

export default getProperty
