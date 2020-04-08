const dropSnapshot = async (pool, snapshotKey) => {
  await pool.executeStatement(
    `DELETE FROM ${pool.escapeId(pool.databaseName)}.${pool.escapeId(
      pool.tableName
    )}
    WHERE ${pool.escapeId('SnapshotKey')}
    LIKE ${pool.escape(`${snapshotKey}%`)}`
  )
}

export default dropSnapshot
