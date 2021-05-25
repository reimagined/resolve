import type { CurrentStoreApi } from './types'

const insert: CurrentStoreApi['insert'] = async (
  pool,
  readModelName,
  tableName,
  document
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
    'insert',
    tableName,
    document
  )

  await inlineLedgerExecuteStatement(
    pool,
    inputQuery,
    inlineLedgerExecuteStatement.SHARED_TRANSACTION_ID
  )
}

export default insert
