const count = async (
  {
    runQuery,
    escapeId,
    escape,
    tablePrefix,
    searchToWhereExpression,
    makeNestedPath
  },
  readModelName,
  tableName,
  searchExpression
) => {
  const searchExpr = searchToWhereExpression(
    searchExpression,
    escapeId,
    escape,
    makeNestedPath
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const rows = await runQuery(
    `SELECT Count(*) AS Count FROM ${escapeId(`${tablePrefix}${tableName}`)}
    ${inlineSearchExpr};`
  )

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
