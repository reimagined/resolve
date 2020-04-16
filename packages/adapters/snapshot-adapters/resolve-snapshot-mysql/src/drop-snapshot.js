const dropSnapshot = async (pool, snapshotKey) => {
  await pool.connection.execute(
    `DELETE FROM ${pool.escapeId(pool.tableName)}
    WHERE ${pool.escapeId('SnapshotKey')}
    LIKE ${pool.escape(`${snapshotKey}%`)}`,
    [snapshotKey]
  )
}

export default dropSnapshot
