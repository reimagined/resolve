const find = async (
  { getCollection, wrapSearchExpression, rootIndex },
  readModelName,
  tableName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {
  const collection = await getCollection(readModelName, tableName)

  const findCursor = await collection.find(
    wrapSearchExpression(searchExpression, rootIndex),
    {
      projection: fieldList ? { _id: 0, ...fieldList } : { _id: 0 },
      ...(Number.isFinite(skip) ? { skip } : {}),
      ...(Number.isFinite(limit) ? { limit } : {}),
      ...(sort ? { sort } : {})
    }
  )

  const result = await findCursor.toArray()

  return result
}

export default find
