const findOne = async (
  {
    runQuery,
    escapeId,
    escape,
    tablePrefix,
    searchToWhereExpression,
    makeNestedPath,
    convertBinaryRow
  },
  readModelName,
  tableName,
  searchExpression,
  fieldList
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
    `SELECT * FROM ${escapeId(`${tablePrefix}${tableName}`)}
    ${inlineSearchExpr}
    LIMIT 0, 1;`
  )

  if (Array.isArray(rows) && rows.length > 0) {
    return convertBinaryRow(rows[0], fieldList)
  }

  return null
}

export default findOne
