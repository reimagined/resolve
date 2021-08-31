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
    searchToWhereExpression,
    updateToSetExpression,
    makeNestedPath,
    splitNestedPath,
    buildUpsertDocument,
    insert,
    count,
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
  const updateExprArray = updateToSetExpression(
    updateExpression,
    escapeId,
    escapeStr,
    makeNestedPath,
    splitNestedPath
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  for (const updateExpr of updateExprArray) {
    if (updateExpr.trim() !== '') {
      await inlineLedgerRunQuery(
        `UPDATE ${escapeId(`${tablePrefix}${tableName}`)}
        SET ${updateExpr} ${inlineSearchExpr}`,
        true
      )
    }
  }
}

export default update
