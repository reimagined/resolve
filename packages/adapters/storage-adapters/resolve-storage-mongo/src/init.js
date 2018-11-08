const init = async ({ collection }) => {
  await collection.createIndex('timestamp')

  await collection.createIndex('aggregateId')

  await collection.createIndex({ timestamp: 1, aggregateVersion: 1 })

  await collection.createIndex(
    { aggregateId: 1, aggregateVersion: 1 },
    { unique: true }
  )
}

export default init
