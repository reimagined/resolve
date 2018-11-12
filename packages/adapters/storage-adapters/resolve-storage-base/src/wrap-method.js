const wrapMethod = (pool, method, ...wrappedArgs) => async (...args) => {
  if (pool.disposed) {
    throw new Error('Adapter has been already disposed')
  }

  pool.connectPromiseResolve()
  await pool.connectPromise

  if (pool.config.skipInit !== true) {
    pool.initialPromiseResolve()
    await pool.initialPromise
  }

  return await method(pool, ...wrappedArgs, ...args)
}

export default wrapMethod
