const defineTable = async (
  { getCollection, rootId },
  readModelName,
  tableName,
  tableDescription
) => {
  const collection = await getCollection(readModelName, tableName, true)
  const root = { _id: rootId, readModelName }
  if (
    tableDescription == null ||
    tableDescription.constructor !== Object ||
    tableDescription.indexes == null ||
    tableDescription.indexes.constructor !== Object ||
    !Array.isArray(tableDescription.fields)
  ) {
    throw new Error(`Wrong table description ${tableDescription}`)
  }

  for (const [idx, indexName] of Object.keys(
    tableDescription.indexes
  ).entries()) {
    const indexArgs = [{ [indexName]: 1 }]
    if (idx === 0) {
      indexArgs.push({ unique: true })
    }
    await collection.createIndex(...indexArgs)

    root[indexName] = rootId
  }

  for (const fieldName of tableDescription.fields) {
    root[fieldName] = 0
  }

  await collection.insertOne(root)
}

export default defineTable
