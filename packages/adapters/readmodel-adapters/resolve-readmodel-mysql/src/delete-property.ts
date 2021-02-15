import type { ExternalMethods } from './types'

const deleteProperty: ExternalMethods['deleteProperty'] = async (
  pool,
  readModelName,
  key
) => {
  const { inlineLedgerRunQuery, tablePrefix, escapeId, escapeStr } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  await inlineLedgerRunQuery(
    `UPDATE ${ledgerTableNameAsId}
     SET \`Properties\` = JSON_REMOVE(\`Properties\`, ${escapeStr(key)})
     WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
    `
  )
}

export default deleteProperty
