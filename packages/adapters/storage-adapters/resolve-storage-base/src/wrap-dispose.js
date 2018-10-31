const wrapDispose = dispose => async (pool, options = {}) => {
  if (options != null && options.constructor !== Object) {
    throw new Error(
      'Dispose options should be object or not be passed to use default behaviour'
    )
  }

  pool.disposed = true

  await dispose(pool, options)
}

export default wrapDispose
