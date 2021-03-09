import type { ExternalMethods } from './types'

const deleteProperty: ExternalMethods['deleteProperty'] = async (
  pool,
  readModelName,
  key
) => {
  const { schemaName, escapeId, escapeStr, inlineLedgerExecuteStatement } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)
  try {
    pool.activePassthrough = true
    await inlineLedgerExecuteStatement(
      pool,
      `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
     SET "Properties" = "Properties" - ${escapeStr(key)} 
     WHERE "EventSubscriber" = ${escapeStr(readModelName)}
    `
    )
  } finally {
    pool.activePassthrough = false
  }
}

export default deleteProperty
