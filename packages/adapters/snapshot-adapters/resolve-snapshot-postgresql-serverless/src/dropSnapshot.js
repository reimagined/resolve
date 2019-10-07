const dropSnapshot = async (pool, snapshotKey) => {
  const { escapeId, escape, connect } = pool
  await connect(pool)

  await pool.executeStatement(
    `DELETE FROM ${escapeId(pool.databaseName)}.${escapeId(pool.tableName)}
    WHERE ${escapeId('SnapshotKey')}
    LIKE ${escape(`${snapshotKey}%`)}`
  )
}

export default dropSnapshot
