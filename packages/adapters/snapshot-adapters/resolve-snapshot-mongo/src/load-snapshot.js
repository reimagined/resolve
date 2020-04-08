const loadSnapshot = async (pool, snapshotKey) => {
  if (snapshotKey == null || snapshotKey.constructor !== String) {
    throw new Error('Snapshot key must be string')
  }
  const database = await pool.client.db()
  const collection = await database.collection(pool.config.tableName)
  const result = await collection.findOne({ snapshotKey })

  return result != null ? result.content : null
}

export default loadSnapshot
