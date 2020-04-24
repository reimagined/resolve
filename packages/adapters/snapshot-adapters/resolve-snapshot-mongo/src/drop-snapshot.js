const dropSnapshot = async (pool, snapshotKey) => {
  const database = await pool.client.db()
  const collection = await database.collection(pool.config.tableName)
  await collection.findOneAndDelete({ snapshotKey })
}

export default dropSnapshot
