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
    makeSqlQuery,
    convertResultRow,
    updateToSetExpression,
    buildUpsertDocument,
    searchToWhereExpression,
    makeNestedPath,
    splitNestedPath,
    escapeId,
    escapeStr,
    tablePrefix,
    schemaName,
  } = pool

  const inputQuery = makeSqlQuery(
    {
      searchToWhereExpression,
      updateToSetExpression,
      buildUpsertDocument,
      splitNestedPath,
      makeNestedPath,
      escapeId,
      escapeStr,
      readModelName,
      schemaName,
      tablePrefix,
    },
    'findOne',
    tableName,
    searchExpression,
    fieldList
  )

  const rows = (await inlineLedgerExecuteStatement(
    pool,
    inputQuery,
    inlineLedgerExecuteStatement.SHARED_TRANSACTION_ID
  )) as Array<MarshalledRowLike>

  if (Array.isArray(rows) && rows.length > 0) {
    return convertResultRow(rows[0], fieldList)
  }

  return null
}

export default findOne
