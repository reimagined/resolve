const dispose = async pool => {
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }
  pool.disposed = true

  if (pool.connectPromise != null) {
    await pool.connectPromise
  }

  if (pool.counters != null) {
    pool.counters.clear()
  }
}

export default dispose
