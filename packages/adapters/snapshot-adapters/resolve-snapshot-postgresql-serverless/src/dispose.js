const dispose = async pool => {
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }

  pool.disposed = true

  pool.counters.clear()
}

export default dispose
