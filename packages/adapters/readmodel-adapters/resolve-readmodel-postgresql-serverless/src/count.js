const count = async (
  {
    executeStatement,
    escapeId,
    escape,
    tablePrefix,
    searchToWhereExpression,
    makeNestedPath,
    schemaName
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

  const rows = await executeStatement(
    `SELECT Count(*) AS ${escapeId('Count')}
    FROM ${escapeId(schemaName)}.${escapeId(`${tablePrefix}${tableName}`)}
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
