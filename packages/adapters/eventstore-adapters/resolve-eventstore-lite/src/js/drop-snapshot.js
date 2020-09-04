const dropSnapshot = async (pool, snapshotKey) => {
  await pool.database.exec(
    `DELETE FROM ${pool.escapeId(pool.snapshotsTableName)}
    WHERE ${pool.escapeId('snapshotKey')}=
    ${pool.escape(snapshotKey)}`
  )
}

export default dropSnapshot
