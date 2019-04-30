const del = async (
  {
    runQuery,
    tablePrefix,
    escapeId,
    escape,
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

  await runQuery(
    `DELETE FROM ${escapeId(`${tablePrefix}${tableName}`)}
    ${inlineSearchExpr}`
  )
}

export default del
