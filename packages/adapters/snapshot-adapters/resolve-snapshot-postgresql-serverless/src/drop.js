const drop = async pool => {
  const { escapeId, connect } = pool
  await connect(pool)

  await pool.executeStatement(`DROP TABLE ${escapeId(pool.tableName)}`)
}

export default drop
