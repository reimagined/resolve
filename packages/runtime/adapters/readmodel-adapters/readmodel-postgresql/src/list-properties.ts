import type { ExternalMethods } from './types'

const listProperties: ExternalMethods['listProperties'] = async (
  pool,
  readModelName
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
    const rows = (await inlineLedgerRunQuery(
      `SELECT "Properties"
     FROM  ${databaseNameAsId}.${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escapeStr(readModelName)}
    `
    )) as Array<{ Properties: Record<string, string> }>

    if (rows.length === 1) {
      return rows[0].Properties
    } else {
      return null
    }
  } finally {
    pool.activePassthrough = false
  }
}

export default listProperties
