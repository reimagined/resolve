const defineTable = async (
  pool,
  readModelName,
  tableName,
  tableDescription
) => {
  const { getCollection, rootId, rootIndex } = pool
  const collection = await getCollection(readModelName, tableName, true)
  if (pool.collections.has(readModelName)) {
    pool.collections.get(readModelName).add(tableName)
  }
  const root = {
    _id: rootId,
    readModelName,
    transactionList: [],
    indexNames: [],
    fieldNames: []
  }
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
    const indexKeys = { [indexName]: 1 }
    const indexOptions = { name: indexName }
    if (idx === 0) {
      indexOptions.unique = true
    }

    await collection.createIndex(indexKeys, indexOptions)

    root.indexNames.push(indexName)
    root[indexName] = pool.ObjectID()
  }

  root.fieldNames = [...tableDescription.fields]

  await collection.createIndex(
    {
      [rootIndex]: 1
    },
    {
      name: rootIndex,
      unique: false
    }
  )

  root[rootIndex] = true

  await collection.insertOne(root)
}

export default defineTable
