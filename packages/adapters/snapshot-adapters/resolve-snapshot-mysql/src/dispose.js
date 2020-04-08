const dispose = async pool => {
  if (pool.counters != null) {
    pool.counters.clear()
  }

  if (pool.connection != null) {
    await pool.connection.end()
  }
}

export default dispose
