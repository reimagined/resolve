async function wrappedMethod(pool: any, method: Function, wrappedArgs: Array<any>, ...args: Array<any>) {
  if (pool.disposed) {
    throw new Error('Adapter has been already disposed')
  }

  pool.isInitialized = true
  pool.connectPromiseResolve()
  await pool.connectPromise

  return await method(pool, ...wrappedArgs, ...args)
}

function wrapMethod (pool: any, method: Function, ...wrappedArgs: Array<any>) {
  return typeof method === 'function'
    ? wrappedMethod.bind(null, pool, method, wrappedArgs)
    : null
}

export default wrapMethod
