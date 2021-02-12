import type { CurrentStoreApi } from './types'

const count: CurrentStoreApi['count'] = async (
  {
    runQuery,
    escapeId,
    escapeStr,
    tablePrefix,
    searchToWhereExpression,
    makeNestedPath,
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
    makeNestedPath
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const rows = (await runQuery(
    `SELECT Count(*) AS ${escapeId('Count')}
    FROM ${escapeId(schemaName)}.${escapeId(`${tablePrefix}${tableName}`)}
    ${inlineSearchExpr};`
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
