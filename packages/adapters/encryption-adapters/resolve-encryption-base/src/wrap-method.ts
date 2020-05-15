import { Pool } from './types'

type Func<Database, Args extends any[], Result extends any> = (
  pool: Pool<Database>,
  ...args: Args
) => Promise<Result>

function wrapMethod<Database, Args extends any[], Result extends any>(
  pool: Pool<Database>,
  method: Func<Database, Args, Result>
) {
  if (pool.disposed) {
    throw new Error('Adapter has been already disposed')
  }

  return async (...args: Args): Promise<Result> => {
    pool.isInitialized = true
    await pool.connectPromiseResolve()
    await pool.connectPromise

    return method(pool, ...args)
  }
}

export default wrapMethod
