const del = async (
  {
    executeStatement,
    tablePrefix,
    escapeId,
    escape,
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

  await executeStatement(
    `DELETE FROM ${escapeId(schemaName)}.${escapeId(
      `${tablePrefix}${tableName}`
    )}
    ${inlineSearchExpr};`
  )
}

export default del
