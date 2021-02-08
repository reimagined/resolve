import type { CurrentStoreApi } from './types'

const del: CurrentStoreApi["delete"] = async (
  pool,
  readModelName,
  tableName,
  searchExpression
) => {
  const {
    executeStatement,
    tablePrefix,
    escapeId,
    escapeStr,
    searchToWhereExpression,
    makeNestedPath,
    schemaName,
  } = pool
  const searchExpr = searchToWhereExpression(
    searchExpression,
    escapeId,
    escapeStr,
    makeNestedPath
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  await executeStatement(
    pool,
    `DELETE FROM ${escapeId(schemaName)}.${escapeId(
      `${tablePrefix}${tableName}`
    )}
    ${inlineSearchExpr};`
  )
}

export default del
