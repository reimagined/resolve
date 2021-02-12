import type { ExternalMethods } from './types'

const setProperty: ExternalMethods['setProperty'] = async (
  pool,
  readModelName,
  key,
  value
) => {
  const { schemaName, escapeId, escapeStr, inlineLedgerExecuteStatement } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)

  await inlineLedgerExecuteStatement(
    pool,
    `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
     SET "Properties" = "Properties" || ${escapeStr(
       JSON.stringify({ [key]: value })
     )}::JSONB 
     WHERE "EventSubscriber" = ${escapeStr(readModelName)}
    `
  )
}

export default setProperty
