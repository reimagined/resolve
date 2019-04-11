const update = async (
  { getCollection, wrapSearchExpression, rootId },
  readModelName,
  tableName,
  searchExpression,
  updateExpression,
  options
) => {
  const collection = await getCollection(readModelName, tableName)

  return await collection.updateMany(
    wrapSearchExpression(searchExpression, rootId),
    updateExpression,
    { upsert: options != null ? !!options.upsert : false }
  )
}

export default update
