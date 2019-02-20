const bindWithConnection = (...bindArgs) => async (...funcArgs) => {
  const [pool, func, readModelName] = bindArgs
  if (!pool.connectPromise) {
    pool.connectPromise = pool.connect(pool.adapterPool, pool.options)
  }
  await pool.connectPromise

  if (bindArgs.length === 3) {
    return await func(pool.adapterPool, readModelName, ...funcArgs)
  } else {
    return await func(pool.adapterPool, ...funcArgs)
  }
}

export default bindWithConnection
