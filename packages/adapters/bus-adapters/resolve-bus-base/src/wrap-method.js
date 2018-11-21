const wrapMethod = (pool, method) => async (...args) => {
  if (pool.disposed) {
    throw new Error('Adapter has been already disposed')
  }
  pool.initialPromiseResolve()
  await pool.initialPromise
  return await method(pool, ...args)
}

export default wrapMethod
