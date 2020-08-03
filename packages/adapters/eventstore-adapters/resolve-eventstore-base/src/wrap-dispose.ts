function wrapDispose(pool: any, dispose: Function)  {
  return async function (options = {}) {
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

    await dispose(pool, options)
  }
}

export default wrapDispose
