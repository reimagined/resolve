const MAX_LIMIT_VALUE = 0x0fffffff | 0

const find = async (
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
              nestedPath.length > 0
                ? `json_extract(${escapeId(baseName)}, '${makeNestedPath(
                    nestedPath
                  )}')`
                : escapeId(baseName)
            return sort[fieldName] > 0
              ? `${provisionedName} ASC`
              : `${provisionedName} DESC`
          })
          .join(', ')
      : ''

  const skipLimit = `LIMIT ${isFinite(skip) ? skip : 0},${
    isFinite(limit) ? limit : MAX_LIMIT_VALUE
  }`

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
    ${orderExpression}
    ${skipLimit}`
  )

  for (let idx = 0; idx < rows.length; idx++) {
    rows[idx] = convertBinaryRow(rows[idx], readModelName, fieldList)
  }

  return rows
}

export default find
