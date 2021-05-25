import type { CurrentStoreApi } from './types'

const del: CurrentStoreApi['delete'] = async (
  pool,
  readModelName,
  tableName,
  searchExpression
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
    'delete',
    tableName,
    searchExpression
  )

  await inlineLedgerExecuteStatement(
    pool,
    inputQuery,
    inlineLedgerExecuteStatement.SHARED_TRANSACTION_ID
  )
}

export default del
