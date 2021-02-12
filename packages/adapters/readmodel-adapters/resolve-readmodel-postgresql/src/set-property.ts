import type { ExternalMethods } from './types'

const setProperty: ExternalMethods['setProperty'] = async (
  pool,
  readModelName,
  key,
  value
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

  await inlineLedgerRunQuery(
    `UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
     SET "Properties" = "Properties" || ${escapeStr(
       JSON.stringify({ [key]: value })
     )}::JSONB 
     WHERE "EventSubscriber" = ${escapeStr(readModelName)}
    `
  )
}

export default setProperty
