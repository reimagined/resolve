const update = async (
  pool,
  readModelName,
  tableName,
  searchExpression,
  updateExpression,
  options
) => {
  const {
    runQuery,
    tablePrefix,
    escapeId,
    escape,
    count,
    buildUpsertDocument,
    insert,
    searchToWhereExpression,
    updateToSetExpression,
    makeNestedPath
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
      const document = buildUpsertDocument(searchExpression, updateExpression)
      await insert(pool, readModelName, tableName, document)
      return
    }
  }

  const searchExpr = searchToWhereExpression(
    searchExpression,
    escapeId,
    escape,
    makeNestedPath
  )
  const updateExpr = updateToSetExpression(
    updateExpression,
    escapeId,
    escape,
    makeNestedPath
  )

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  await runQuery(
    `UPDATE ${escapeId(`${tablePrefix}${tableName}`)}
    SET ${updateExpr} ${inlineSearchExpr};`
  )
}

export default update
