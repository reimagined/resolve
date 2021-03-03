import type { ExternalMethods } from './types'

const getProperty: ExternalMethods['getProperty'] = async (
  pool,
  readModelName,
  key
) => {
  const { inlineLedgerRunQuery, tablePrefix, escapeId, escapeStr } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  try {
    pool.activePassthrough = true
    const rows = (await inlineLedgerRunQuery(
      `SELECT \`Properties\` -> ${escapeStr(key)} AS \`Value\`
     FROM  ${ledgerTableNameAsId}
     WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
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
