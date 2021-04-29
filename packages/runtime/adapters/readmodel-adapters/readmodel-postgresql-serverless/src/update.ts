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
    tablePrefix,
    escapeId,
    escapeStr,
    count,
    buildUpsertDocument,
    insert,
    searchToWhereExpression,
    updateToSetExpression,
    makeNestedPath,
    splitNestedPath,
    schemaName,
  } = pool

  const isUpsert = options != null ? !!options.upsert : false

  if (isUpsert) {
    const foundDocumentsCount = await count(
      pool,
      readModelName,
      tableName,
      searchExpression
    )

    if (foundDocumentsCount === 0) {
      const document = buildUpsertDocument(
        searchExpression,
        updateExpression,
        splitNestedPath
      )
      await insert(pool, readModelName, tableName, document)
      return
    }
  }

  const searchExpr = searchToWhereExpression(
    searchExpression,
    escapeId,
    escapeStr,
    makeNestedPath,
    splitNestedPath
  )
  const updateExpr = updateToSetExpression(
    updateExpression,
    escapeId,
    escapeStr,
    makeNestedPath,
    splitNestedPath
  )

  if (updateExpr.trim() === '') {
    return
  }

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  await inlineLedgerExecuteStatement(
    pool,
    `UPDATE ${escapeId(schemaName)}.${escapeId(`${tablePrefix}${tableName}`)}
    SET ${updateExpr} ${inlineSearchExpr};`,
    inlineLedgerExecuteStatement.SHARED_TRANSACTION_ID
  )
}

export default update
