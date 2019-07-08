const listReadModelTables = async (
  { databasePromise, rootId },
  readModelName
) => {
  const database = await databasePromise
  const tablesNames = []

  for (const {
    s: { name }
  } of await database.collections()) {
    const collection = await database.collection(name)
    const root = await collection.findOne({ _id: rootId })

    if (root != null && root.readModelName === readModelName) {
      tablesNames.push(name)
    }
  }

  return tablesNames
}

export default listReadModelTables
