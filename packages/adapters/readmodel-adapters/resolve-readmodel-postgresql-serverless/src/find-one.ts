import type { CurrentStoreApi, MarshalledRowLike } from './types'

const findOne: CurrentStoreApi['findOne'] = async (
  pool,
  readModelName,
  tableName,
  searchExpression,
  fieldList
) => {
  const {
    inlineLedgerExecuteStatement,
    escapeId,
    escapeStr,
    tablePrefix,
    searchToWhereExpression,
    makeNestedPath,
    convertResultRow,
    schemaName,
  } = pool

  const searchExpr = searchToWhereExpression(
    searchExpression,
    escapeId,
    escapeStr,
    makeNestedPath
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const rows = (await inlineLedgerExecuteStatement(
    pool,
    `SELECT * FROM ${escapeId(schemaName)}.${escapeId(
      `${tablePrefix}${tableName}`
    )}
    ${inlineSearchExpr}
    OFFSET 0
    LIMIT 1;`,
    inlineLedgerExecuteStatement.SHARED_TRANSACTION_ID
  )) as Array<MarshalledRowLike>

  if (Array.isArray(rows) && rows.length > 0) {
    return convertResultRow(rows[0], fieldList)
  }

  return null
}

export default findOne
