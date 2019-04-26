const del = async (
  { getCollection, wrapSearchExpression, rootId },
  readModelName,
  tableName,
  searchExpression
) => {
  const collection = await getCollection(readModelName, tableName)

  return await collection.deleteMany(
    wrapSearchExpression(searchExpression, rootId)
  )
}

export default del
