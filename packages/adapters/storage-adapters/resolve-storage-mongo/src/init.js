const init = async pool => {
  pool.collection = await pool.database.collection(pool.collectionName)

  await pool.collection.createIndex('timestamp')

  await pool.collection.createIndex('aggregateId')

  await pool.collection.createIndex({ timestamp: 1, aggregateVersion: 1 })

  await pool.collection.createIndex(
    { aggregateId: 1, aggregateVersion: 1 },
    { unique: true }
  )
}

export default init
