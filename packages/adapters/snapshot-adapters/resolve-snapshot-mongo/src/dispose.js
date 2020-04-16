const dispose = async pool => {
  if (pool.counters != null) {
    pool.counters.clear()
  }

  if (pool.client != null) {
    await pool.client.close()
  }
}

export default dispose
