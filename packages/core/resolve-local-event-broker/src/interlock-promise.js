const interlockPromise = async (pool, promiseName) => {
  let unlock = null
  while (Promise.resolve(pool[promiseName]) === pool[promiseName]) {
    await pool[promiseName]
  }

  pool[promiseName] = new Promise(resolve => {
    unlock = () => {
      delete pool[promiseName]
      resolve()
    }
  })

  return unlock
}

export default interlockPromise
