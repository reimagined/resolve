const dropReadModel = async ({ databasePromise, rootId }, readModelName) => {
  const database = await databasePromise

  for (const {
    s: { name }
  } of await database.collections()) {
    const collection = await database.collection(name)
    const root = await collection.findOne({ _id: rootId })

    if (root != null && root.readModelName === readModelName) {
      await collection.drop()
    }
  }
}

export default dropReadModel
