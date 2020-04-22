const dropSnapshot = async (pool, snapshotKey) => {
  await pool.database.exec(
    `DELETE FROM ${pool.escapeId(pool.tableName)} 
    WHERE ${pool.escapeId('snapshotKey')}=
    ${pool.escape(snapshotKey)}`
  )
}

export default dropSnapshot
