const commitTransaction = async (pool, readModelName) => {
  const { rootId, listReadModelTables } = pool
  const readModelTables = await listReadModelTables(pool, readModelName)
  if (readModelTables.length === 0) {
    return
  }

  const collections = new Map()
  for (const tableName of readModelTables) {
    collections.set(
      tableName,
      await pool.getCollection(readModelName, tableName)
    )
  }

  const transactionCollection = collections.get(readModelTables[0])

  const { transactionList } = await transactionCollection.findOne(
    { _id: rootId },
    { projection: { transactionList: 1 } }
  )

  await transactionCollection.updateOne(
    { _id: rootId },
    {
      $set: { transactionList: [] }
    }
  )

  for (const { collectionName, snapshotId } of transactionList) {
    const collection = collections.get(collectionName)
    await collection.removeOne({ _id: snapshotId })
  }
}

export default commitTransaction
