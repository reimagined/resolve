const dispose = async (pool, options) => {
  if (options.dropEvents) {
    await pool.connection.execute(`
      DELETE FROM ${pool.escapeId(pool.tableName)}
    `)
  }

  await pool.connection.end()
}

export default dispose
