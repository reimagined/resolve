const dispose = async pool => {
  if (pool.counters != null) {
    pool.counters.clear()
  }

  if (pool.database != null) {
    await pool.database.close()
  }
}

export default dispose
