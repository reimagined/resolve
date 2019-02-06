const dispose = async (pool, options = {}) => {
  if (options == null || options.constructor !== Object) {
    throw new Error(
      'Dispose options should be object or not be passed to use default behaviour'
    )
  }

  if (pool.disposePromise != null) {
    return await pool.disposePromise
  }
  for (const viewModel of pool.activeWorkers.values()) {
    viewModel.disposed = true
  }

  pool.disposePromise = Promise.resolve()
  pool.activeWorkers.clear()

  return await pool.disposePromise
}

export default dispose
