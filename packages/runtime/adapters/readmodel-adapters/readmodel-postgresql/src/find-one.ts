import type { CurrentStoreApi, MarshalledRowLike } from './types'

const findOne: CurrentStoreApi['findOne'] = async (
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
    `SELECT * FROM ${escapeId(schemaName)}.${escapeId(
      `${tablePrefix}${tableName}`
    )}
    ${inlineSearchExpr}
    OFFSET 0
    LIMIT 1;`
  )) as Array<MarshalledRowLike>

  if (Array.isArray(rows) && rows.length > 0) {
    return convertResultRow(rows[0], fieldList)
  }

  return null
}

export default findOne
