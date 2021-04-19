import type { CurrentStoreApi } from './types'

const count: CurrentStoreApi['count'] = async (
  pool,
  readModelName,
  tableName,
  searchExpression
) => {
  const {
    inlineLedgerExecuteStatement,
    escapeId,
    escapeStr,
    tablePrefix,
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

  const rows = (await inlineLedgerExecuteStatement(
    pool,
    `SELECT Count(*) AS ${escapeId('Count')}
    FROM ${escapeId(schemaName)}.${escapeId(`${tablePrefix}${tableName}`)}
    ${inlineSearchExpr};`,
    inlineLedgerExecuteStatement.SHARED_TRANSACTION_ID
  )) as Array<{ Count: number }>

  if (
    Array.isArray(rows) &&
    rows.length > 0 &&
    rows[0] != null &&
    Number.isInteger(+rows[0].Count)
  ) {
    return +rows[0].Count
  }

  return 0
}

export default count
