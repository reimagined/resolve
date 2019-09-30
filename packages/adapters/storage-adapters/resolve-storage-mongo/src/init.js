const init = async pool => {
  pool.collection = await pool.database.collection(pool.collectionName)

  pool.collection.createIndex('timestamp')

  pool.collection.createIndex('aggregateId')

  pool.collection.createIndex({ timestamp: 1, aggregateVersion: 1 })

  pool.collection.createIndex(
    { aggregateId: 1, aggregateVersion: 1 },
    { unique: true }
  )
}

export default init
