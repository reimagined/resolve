import type { ExternalMethods } from './types'

const getProperty: ExternalMethods['getProperty'] = async (
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
    const rows = (await inlineLedgerRunQuery(
      `SELECT "Properties" -> ${escapeStr(key)} AS "Value"
     FROM  ${databaseNameAsId}.${ledgerTableNameAsId}
     WHERE "EventSubscriber" = ${escapeStr(readModelName)}
    `
    )) as Array<{ Value: string }>

    if (rows.length === 1 && rows[0].Value != null) {
      return rows[0].Value
    } else {
      return null
    }
  } finally {
    pool.activePassthrough = false
  }
}

export default getProperty
