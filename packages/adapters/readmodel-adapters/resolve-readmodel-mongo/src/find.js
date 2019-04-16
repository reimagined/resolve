const find = async (
  { getCollection, wrapSearchExpression, rootId },
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
    wrapSearchExpression(searchExpression, rootId),
    {
      projection: fieldList ? { _id: 0, ...fieldList } : { _id: 0 },
      ...(Number.isFinite(skip) ? { skip } : {}),
      ...(Number.isFinite(limit) ? { limit } : {}),
      ...(sort ? { sort } : {})
    }
  )

  return await findCursor.toArray()
}

export default find
