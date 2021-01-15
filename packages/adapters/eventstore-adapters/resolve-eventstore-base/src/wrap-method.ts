const wrappedMethod = async (
  pool: any,
  method: any,
  wrappedArgs: any,
  ...args: any
): Promise<any> => {
  if (pool.disposed) {
    throw new Error('Adapter has been already disposed')
  }

  pool.isInitialized = true
  pool.connectPromiseResolve()
  await pool.connectPromise

  return await method(pool, ...wrappedArgs, ...args)
}

const wrapMethod = (pool: any, method: any, ...wrappedArgs: any): any =>
  typeof method === 'function'
    ? wrappedMethod.bind(null, pool, method, wrappedArgs)
    : null

export default wrapMethod
