import type { CurrentStoreApi, MarshalledRowLike, JsonMap } from './types'

const MAX_LIMIT_VALUE = 0x0fffffff | 0

const find: CurrentStoreApi['find'] = async (
  {
    inlineLedgerRunQuery,
    escapeId,
    escapeStr,
    tablePrefix,
    searchToWhereExpression,
    makeNestedPath,
    convertResultRow,
    schemaName,
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
          .map((fieldName) => {
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
    OFFSET ${isFinite(+(skip as number)) ? +(skip as number) : 0}
    LIMIT ${isFinite(+(limit as number)) ? +(limit as number) : MAX_LIMIT_VALUE}
  `

  const searchExpr = searchToWhereExpression(
    searchExpression,
    escapeId,
    escapeStr,
    makeNestedPath
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const inputRows = (await inlineLedgerRunQuery(
    `SELECT * FROM ${escapeId(schemaName)}.${escapeId(
      `${tablePrefix}${tableName}`
    )}
    ${inlineSearchExpr}
    ${orderExpression}
    ${skipLimit};`
  )) as Array<MarshalledRowLike>

  const rows: Array<JsonMap> = []

  for (let idx = 0; idx < inputRows.length; idx++) {
    rows[idx] = convertResultRow(inputRows[idx], fieldList)
  }

  return rows
}

export default find
