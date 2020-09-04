const loadSnapshot = async (pool, snapshotKey) => {
  if (snapshotKey == null || snapshotKey.constructor !== String) {
    throw new Error('Snapshot key must be string')
  }

  const result = await pool.database.get(
    `SELECT ${pool.escapeId('content')} 
    FROM ${pool.escapeId(pool.snapshotsTableName)} 
    WHERE ${pool.escapeId('snapshotKey')} = 
    ${pool.escape(snapshotKey)}`
  )

  return result != null ? result.content : null
}

export default loadSnapshot
