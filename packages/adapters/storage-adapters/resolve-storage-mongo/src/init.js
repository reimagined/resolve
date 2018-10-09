const init = async (MongoClient, pool) => {
  const { url, collectionName, databaseName } = pool.config

  const client = await MongoClient.connect(url)
  const db = await client.db(databaseName)
  const collection = await db.collection(collectionName)

  await collection.createIndex('timestamp')

  await collection.createIndex('aggregateId')

  await collection.createIndex({ timestamp: 1, aggregateVersion: 1 })

  await collection.createIndex(
    { aggregateId: 1, aggregateVersion: 1 },
    { unique: true }
  )

  Object.assign(pool, {
    client,
    db,
    collection
  })
}

export default init
