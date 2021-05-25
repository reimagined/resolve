import type { CurrentStoreApi } from './types'

const count: CurrentStoreApi['count'] = async (
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
    'count',
    tableName,
    searchExpression
  )

  const rows = (await inlineLedgerExecuteStatement(
    pool,
    inputQuery,
    inlineLedgerExecuteStatement.SHARED_TRANSACTION_ID
  )) as Array<{ Count: number }>

  if (
    Array.isArray(rows) &&
    rows.length > 0 &&
    rows[0] != null &&
    Number.isInteger(+rows[0].Count)
  ) {
    return +rows[0].Count
  }

  return 0
}

export default count
