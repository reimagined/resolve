const status = async (pool, readModelName) => {
  const { schemaName, escapeId, escape, inlineLedgerExecuteStatement } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)

  const rows = await inlineLedgerExecuteStatement(
    pool,
    `SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escape(readModelName)}
    `
  )

  console.log('status^^^^')
  console.log(rows)

  if (rows.length === 1) {
    return rows[0]
  } else {
    return null
  }
}

export default status
