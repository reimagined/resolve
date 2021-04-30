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
    schemaName,
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
    `DELETE FROM ${escapeId(schemaName)}.${escapeId(
      `${tablePrefix}${tableName}`
    )}
    ${inlineSearchExpr};`
  )
}

export default del
