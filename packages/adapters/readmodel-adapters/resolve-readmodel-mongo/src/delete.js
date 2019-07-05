const del = async (pool, readModelName, tableName, searchExpression) => {
  const { getCollection, wrapSearchExpression, rootIndex } = pool
  const collection = await getCollection(readModelName, tableName)

  const wrappedSearchExpression = wrapSearchExpression(
    searchExpression,
    rootIndex
  )
  await pool.makeDocumentsSnapshots(
    pool,
    readModelName,
    tableName,
    wrappedSearchExpression
  )

  await collection.deleteMany(wrappedSearchExpression)
}

export default del
