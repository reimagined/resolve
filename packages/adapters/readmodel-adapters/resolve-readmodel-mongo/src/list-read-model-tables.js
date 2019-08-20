const listReadModelTables = async (
  { databasePromise, rootId, collections },
  readModelName
) => {
  if (collections.has(readModelName)) {
    return Array.from(collections.get(readModelName))
  }

  const database = await databasePromise
  const tablesNames = []

  for (const { name } of await database.listCollections().toArray()) {
    const collection = await database.collection(name)
    const root = await collection.findOne({ _id: rootId })

    if (root != null && root.readModelName === readModelName) {
      tablesNames.push(name)
    }
  }

  collections.set(readModelName, new Set(tablesNames))

  return tablesNames
}

export default listReadModelTables
