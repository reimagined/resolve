import type { CurrentStoreApi } from './types'

const update: CurrentStoreApi['update'] = async (
  pool,
  readModelName,
  tableName,
  searchExpression,
  updateExpression,
  options
) => {
  const {
    inlineLedgerRunQuery,
    tablePrefix,
    escapeId,
    escapeStr,
    count,
    buildUpsertDocument,
    insert,
    searchToWhereExpression,
    updateToSetExpression,
    makeNestedPath,
    splitNestedPath
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
      const document = buildUpsertDocument(searchExpression, updateExpression, splitNestedPath)
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

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  await inlineLedgerRunQuery(
    `UPDATE ${escapeId(`${tablePrefix}${tableName}`)}
    SET ${updateExpr} ${inlineSearchExpr};`
  )
}

export default update
