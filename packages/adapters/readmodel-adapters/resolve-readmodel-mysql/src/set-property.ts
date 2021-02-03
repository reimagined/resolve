import type { ExternalMethods } from './types'

const setProperty: ExternalMethods['setProperty'] = async (
  pool,
  readModelName,
  key,
  value
) => {
  const { inlineLedgerRunQuery, tablePrefix, escapeId, escapeStr } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  await inlineLedgerRunQuery(
    `UPDATE ${ledgerTableNameAsId}
     SET \`Properties\` = JSON_MERGE_PRESERVE(\`Properties\`, CAST(${escapeStr(
       JSON.stringify({ [key]: value })
     )} AS JSON))
     WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
    `
  )
}

export default setProperty
