import rollbackTransaction from './rollback-transaction'

const beginTransaction = async (pool, readModelName) => {
  const readModelTables = await pool.listReadModelTables(pool, readModelName)
  if (readModelTables.length === 0) {
    return
  }

  await rollbackTransaction(pool, readModelName)

  const cleanupPromises = []
  for (const tableName of readModelTables) {
    const collection = await pool.getCollection(readModelName, tableName)

    cleanupPromises.push(
      collection.deleteMany({
        $and: [{ [pool.rootIndex]: true }, { _id: { $ne: pool.rootId } }]
      })
    )
  }

  await Promise.all(cleanupPromises)
}

export default beginTransaction
