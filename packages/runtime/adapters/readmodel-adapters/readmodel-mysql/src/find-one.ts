import type { CurrentStoreApi, MarshalledRowLike } from './types'

const findOne: CurrentStoreApi['findOne'] = async (
  {
    inlineLedgerRunQuery,
    escapeId,
    escapeStr,
    tablePrefix,
    searchToWhereExpression,
    makeNestedPath,
    convertBinaryRow,
  },
  readModelName,
  tableName,
  searchExpression,
  fieldList
) => {
  const searchExpr = searchToWhereExpression(
    searchExpression,
    escapeId,
    escapeStr,
    makeNestedPath
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const rows = (await inlineLedgerRunQuery(
    `SELECT * FROM ${escapeId(`${tablePrefix}${tableName}`)}
    ${inlineSearchExpr}
    LIMIT 0, 1;`
  )) as Array<MarshalledRowLike>

  if (Array.isArray(rows) && rows.length > 0) {
    return convertBinaryRow(rows[0], fieldList)
  }

  return null
}

export default findOne
