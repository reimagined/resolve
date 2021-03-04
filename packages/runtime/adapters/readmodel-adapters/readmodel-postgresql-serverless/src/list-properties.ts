import type { ExternalMethods } from './types'

const listProperties: ExternalMethods['listProperties'] = async (
  pool,
  readModelName
) => {
  const { schemaName, escapeId, escapeStr, inlineLedgerExecuteStatement } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)
  try {
    pool.activePassthrough = true
    const rows = (await inlineLedgerExecuteStatement(
      pool,
      `SELECT "Properties"
     FROM  ${databaseNameAsId}.${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escapeStr(readModelName)}
    `
    )) as Array<Record<string, string>>

    if (rows.length === 1) {
      return rows[0].Properties != null ? JSON.parse(rows[0].Properties) : null
    } else {
      return null
    }
  } finally {
    pool.activePassthrough = false
  }
}

export default listProperties
