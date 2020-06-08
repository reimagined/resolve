const saveSnapshot = async (pool, snapshotKey, content) => {
  if (snapshotKey == null || snapshotKey.constructor !== String) {
    throw new Error('Snapshot key must be string')
  }
  if (content == null || content.constructor !== String) {
    throw new Error('Snapshot content must be string')
  }

  if (!pool.counters.has(snapshotKey)) {
    pool.counters.set(snapshotKey, 0)
  }

  if (pool.counters.get(snapshotKey) < pool.bucketSize) {
    pool.counters.set(snapshotKey, pool.counters.get(snapshotKey) + 1)
    return
  }
  pool.counters.set(snapshotKey, 0)

  await pool.database.exec(
    `INSERT INTO ${pool.escapeId(pool.snapshotsTableName)} 
    VALUES (${pool.escape(snapshotKey)}, ${pool.escape(content)})`
  )
}

export default saveSnapshot
