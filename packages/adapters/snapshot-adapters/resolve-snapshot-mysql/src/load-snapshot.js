const loadSnapshot = async (pool, snapshotKey) => {
  if (snapshotKey == null || snapshotKey.constructor !== String) {
    throw new Error('Snapshot key must be string')
  }

  const [rows] = await pool.connection.execute(
    `SELECT ${pool.escapeId('SnapshotContent')} FROM ${pool.escapeId(
      pool.tableName
    )}
   WHERE ${pool.escapeId('SnapshotKey')}= ${pool.escape(snapshotKey)} `
  )
  const content = rows.length > 0 ? rows[0].SnapshotContent.toString() : null

  return content
}

export default loadSnapshot
