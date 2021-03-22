import type { ExternalMethods } from './types'

const listProperties: ExternalMethods['listProperties'] = async (
  pool,
  readModelName
) => {
  const { inlineLedgerRunQuery, tablePrefix, escapeId, escapeStr } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  try {
    pool.activePassthrough = true
    const rows = (await inlineLedgerRunQuery(
      `SELECT \`Properties\`
     FROM  ${ledgerTableNameAsId}
     WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
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
