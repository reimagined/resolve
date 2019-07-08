const findOne = async (
  { getCollection, wrapSearchExpression, rootIndex },
  readModelName,
  tableName,
  searchExpression,
  fieldList
) => {
  const collection = await getCollection(readModelName, tableName)
  const wrappedSearchExpression = wrapSearchExpression(
    searchExpression,
    rootIndex
  )
  const result = await collection.findOne(wrappedSearchExpression, {
    projection: fieldList ? { _id: 0, ...fieldList } : { _id: 0 }
  })

  return result
}

export default findOne
