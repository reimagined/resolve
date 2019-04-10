const findOne = async (
  { getCollection, wrapSearchExpression, rootId },
  readModelName,
  tableName,
  searchExpression,
  fieldList
) => {
  const collection = await getCollection(readModelName, tableName)

  return await collection.findOne(
    wrapSearchExpression(searchExpression, rootId),
    {
      projection: fieldList ? { _id: 0, ...fieldList } : { _id: 0 }
    }
  )
}

export default findOne
