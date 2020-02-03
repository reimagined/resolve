const init = async ({ database, collectionName }) => {
  await database.createCollection(collectionName)
  const collection = await database.collection(collectionName)
  await collection.createIndex(
    { threadId: 1, threadCounter: 1 },
    { unique: true }
  )
  await collection.createIndex('timestamp')
  await collection.createIndex('aggregateId')
  await collection.createIndex(
    { aggregateId: 1, aggregateVersion: 1 },
    { unique: true }
  )
}

export default init
