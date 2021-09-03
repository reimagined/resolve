import type { CurrentStoreApi } from './types'

const del: CurrentStoreApi['delete'] = async (
  {
    inlineLedgerRunQuery,
    tablePrefix,
    escapeId,
    escapeStr,
    searchToWhereExpression,
    makeNestedPath,
    splitNestedPath,
  },
  readModelName,
  tableName,
  searchExpression
) => {
  const searchExpr = searchToWhereExpression(
    searchExpression,
    escapeId,
    escapeStr,
    makeNestedPath,
    splitNestedPath
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  await inlineLedgerRunQuery(
    `DELETE FROM ${escapeId(`${tablePrefix}${tableName}`)}
    ${inlineSearchExpr}`,
    true
  )
}

export default del
