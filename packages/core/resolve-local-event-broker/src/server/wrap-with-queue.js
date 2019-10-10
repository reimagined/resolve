const wrapWithQueue = async (pool, method, ...args) => {
  while (Promise.resolve(pool.lockPromise) === pool.lockPromise) {
    await pool.lockPromise
  }

  pool.lockPromise = new Promise(resolve => {
    pool.unlockConnection = () => {
      pool.lockPromise = null
      resolve()
    }
  })

  try {
    return await method(pool, ...args)
  } finally {
    pool.unlockConnection()
  }
}

export default wrapWithQueue
