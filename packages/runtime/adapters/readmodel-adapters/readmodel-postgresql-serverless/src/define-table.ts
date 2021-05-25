import type { CurrentStoreApi } from './types'

const defineTable: CurrentStoreApi['defineTable'] = async (
  pool,
  readModelName,
  tableName,
  tableDescription
) => {
  const {
    inlineLedgerExecuteStatement,
    makeSqlQuery,
    searchToWhereExpression,
    updateToSetExpression,
    buildUpsertDocument,
    splitNestedPath,
    makeNestedPath,
    escapeId,
    escapeStr,
    schemaName,
    tablePrefix,
  } = pool

  await inlineLedgerExecuteStatement(
    pool,
    makeSqlQuery(
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
      'defineTable',
      tableName,
      tableDescription
    ),
    inlineLedgerExecuteStatement.SHARED_TRANSACTION_ID
  )
}

export default defineTable
