import { CurrentStoreApi } from './types'

const update: CurrentStoreApi['update'] = async (
  pool,
  readModelName,
  tableName,
  searchExpression,
  updateExpression,
  options
) => {
  const {
    inlineLedgerExecuteStatement,
    makeSqlQuery,
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
    'update',
    tableName,
    searchExpression,
    updateExpression,
    options
  )

  if (inputQuery !== '') {
    await inlineLedgerExecuteStatement(
      pool,
      inputQuery,
      inlineLedgerExecuteStatement.SHARED_TRANSACTION_ID
    )
  }
}

export default update
