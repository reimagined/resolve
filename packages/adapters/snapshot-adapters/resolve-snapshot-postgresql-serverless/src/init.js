const init = async pool => {
  const { escapeId, connect } = pool
  await connect(pool)
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }
  await pool.executeStatement(`CREATE TABLE IF NOT EXISTS ${escapeId(
    pool.databaseName
  )}.${escapeId(pool.tableName)} (
      ${escapeId('SnapshotKey')} text NOT NULL,
      ${escapeId('SnapshotContent')} text,
      PRIMARY KEY(${escapeId('SnapshotKey')})
    )`)
}

export default init
