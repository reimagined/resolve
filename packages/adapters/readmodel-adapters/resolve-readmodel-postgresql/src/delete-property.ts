import type { ExternalMethods } from './types'

const deleteProperty: ExternalMethods['deleteProperty'] = async (
  pool,
  readModelName,
  key
) => {
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
  try {
    pool.activePassthrough = true
    await inlineLedgerRunQuery(
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
