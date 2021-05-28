import type { CurrentStoreApi } from './types'

const del: CurrentStoreApi['delete'] = async (
  pool,
  readModelName,
  tableName,
  searchExpression
) => {
  const {
    inlineLedgerExecuteStatement,
    tablePrefix,
    escapeId,
    escapeStr,
    searchToWhereExpression,
    makeNestedPath,
    splitNestedPath,
    schemaName,
  } = pool
  const searchExpr = searchToWhereExpression(
    searchExpression,
    escapeId,
    escapeStr,
    makeNestedPath,
    splitNestedPath
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  await inlineLedgerExecuteStatement(
    pool,
    `DELETE FROM ${escapeId(schemaName)}.${escapeId(
      `${tablePrefix}${tableName}`
    )}
    ${inlineSearchExpr};`,
    inlineLedgerExecuteStatement.SHARED_TRANSACTION_ID
  )
}

export default del
