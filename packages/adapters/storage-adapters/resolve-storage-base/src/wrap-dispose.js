const wrapDispose = (pool, dispose) => async (options = {}) => {
  if (pool.disposed) {
    throw new Error('Adapter has been already disposed')
  }
  if (options != null && options.constructor !== Object) {
    throw new Error(
      'Dispose options should be object or not be passed to use default behaviour'
    )
  }
  pool.disposed = true
  if (!pool.isInitialized) {
    return
  }

  await pool.connectPromise
  if (pool.config.skipInit !== true) {
    pool.initialPromiseResolve()
    await pool.initialPromise
  }

  await dispose(pool, options)
}

export default wrapDispose
