const rollbackTransaction = async (pool, readModelName) => {
  const { rootId, listReadModelTables, contentField } = pool
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

  const restoredDocumentsIds = new Set()

  const { transactionList } = await transactionCollection.findOne(
    { _id: rootId },
    { projection: { transactionList: 1 } }
  )

  for (const { collectionName, currentId, snapshotId } of transactionList) {
    const collection = collections.get(collectionName)

    if (snapshotId != null) {
      const snapshotDocument = await collection.findOne({ _id: snapshotId })
      if (snapshotDocument == null) {
        continue
      }
      delete snapshotDocument._id

      if (!restoredDocumentsIds.has(currentId)) {
        const { [contentField]: originalDocument } = snapshotDocument

        await collection.replaceOne({ _id: currentId }, originalDocument)

        restoredDocumentsIds.add(currentId)
      }

      await collection.removeOne({ _id: snapshotId })
    } else if (!restoredDocumentsIds.has(currentId)) {
      await collection.removeOne({ _id: currentId })

      restoredDocumentsIds.add(currentId)
    }

    await transactionCollection.updateOne(
      { _id: rootId },
      {
        $pullAll: {
          transactionList: [{ collectionName, currentId, snapshotId }]
        }
      }
    )
  }

  await transactionCollection.updateOne(
    { _id: rootId },
    {
      $set: { transactionList: [] }
    }
  )
}

export default rollbackTransaction
