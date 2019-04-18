const update = async (
  { getCollection, wrapSearchExpression, rootId },
  readModelName,
  tableName,
  searchExpression,
  updateExpression,
  options
) => {
  const collection = await getCollection(readModelName, tableName)

  const resultExpression = Object.assign(
    { $unset: undefined },
    updateExpression
  )
  delete resultExpression['$unset']

  const unsetFields =
    updateExpression['$unset'] != null ? updateExpression['$unset'] : {}
  if (!resultExpression.hasOwnProperty('$set')) {
    resultExpression['$set'] = {}
  }

  for (const field of Object.keys(unsetFields)) {
    resultExpression['$set'][field] = null
  }

  return await collection.updateMany(
    wrapSearchExpression(searchExpression, rootId),
    resultExpression,
    { upsert: options != null ? !!options.upsert : false }
  )
}

export default update
