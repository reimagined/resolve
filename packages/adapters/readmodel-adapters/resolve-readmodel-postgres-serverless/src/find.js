const MAX_LIMIT_VALUE = 0x0fffffff | 0

const find = async (
  {
    executeStatement,
    escapeId,
    escape,
    tablePrefix,
    searchToWhereExpression,
    makeNestedPath,
    convertResultRow,
    schemaName
  },
  readModelName,
  tableName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {
  const orderExpression =
    sort && Object.keys(sort).length > 0
      ? 'ORDER BY ' +
        Object.keys(sort)
          .map(fieldName => {
            const [baseName, ...nestedPath] = fieldName.split('.')
            const provisionedName =
              nestedPath.length === 0
                ? escapeId(baseName)
                : `${escapeId(baseName)}->'${makeNestedPath(nestedPath)}'`
            return sort[fieldName] > 0
              ? `${provisionedName} ASC`
              : `${provisionedName} DESC`
          })
          .join(', ')
      : ''

  const skipLimit = `
    OFFSET ${isFinite(skip) ? skip : 0}
    LIMIT ${isFinite(limit) ? limit : MAX_LIMIT_VALUE}
  `

  const searchExpr = searchToWhereExpression(
    searchExpression,
    escapeId,
    escape,
    makeNestedPath
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const rows = await executeStatement(
    `SELECT * FROM ${escapeId(schemaName)}.${escapeId(
      `${tablePrefix}${tableName}`
    )}
    ${inlineSearchExpr}
    ${orderExpression}
    ${skipLimit};`
  )

  for (let idx = 0; idx < rows.length; idx++) {
    rows[idx] = convertResultRow(rows[idx], fieldList)
  }

  return rows
}

export default find
