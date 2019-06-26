const rootFieldRegExp = /(\.)(?=(?:[^"]|"[^"]*")*$)/

const update = async (
  pool,
  readModelName,
  tableName,
  searchExpression,
  updateExpression,
  options
) => {
  const { getCollection, wrapSearchExpression, rootIndex } = pool
  const collection = await getCollection(readModelName, tableName)

  const resultExpression = Object.assign({ $unset: {} }, updateExpression)

  const unsetFields =
    updateExpression['$unset'] != null ? updateExpression['$unset'] : {}
  if (!resultExpression.hasOwnProperty('$set')) {
    resultExpression['$set'] = {}
  }

  for (const field of Object.keys(unsetFields)) {
    if (rootFieldRegExp.test(field)) {
      resultExpression['$unset'][field] = true
    } else {
      resultExpression['$set'][field] = null
    }
  }

  if (Object.keys(resultExpression['$set']).length === 0) {
    delete resultExpression['$set']
  }
  if (Object.keys(resultExpression['$unset']).length === 0) {
    delete resultExpression['$unset']
  }

  if (Object.keys(resultExpression).length === 0) {
    return
  }

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

  await collection.updateMany(wrappedSearchExpression, resultExpression, {
    upsert: options != null ? !!options.upsert : false
  })
}

export default update
