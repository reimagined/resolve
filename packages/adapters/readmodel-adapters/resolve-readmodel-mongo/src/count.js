const count = async (
  { getCollection, wrapSearchExpression, rootIndex },
  readModelName,
  tableName,
  searchExpression
) => {
  const collection = await getCollection(readModelName, tableName)

  return await collection.countDocuments(
    wrapSearchExpression(searchExpression, rootIndex)
  )
}

export default count
