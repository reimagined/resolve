const wrapMethod = (pool, method, ...wrappedArgs) => async (...args) => {
  if (pool.disposed) {
    throw new Error('Adapter has been already disposed')
  }
  pool.initialPromiseResolve()
  await pool.initialPromise
  return await method(pool, ...wrappedArgs, ...args)
}

export default wrapMethod
