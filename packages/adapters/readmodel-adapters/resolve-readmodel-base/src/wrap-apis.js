const bindWithConnection = (connector, pool, options, func) => async (
  ...args
) => {
  if (!pool.connectPromise) {
    pool.connectPromise = connector(pool.adapterContext, options)
  }

  await pool.connectPromise

  return await func(pool.adapterContext, ...args)
}

const wrapApis = (implementation, pool, options) => {
  const metaApi = Object.keys(implementation.metaApi).reduce((acc, key) => {
    acc[key] = bindWithConnection(
      implementation.metaApi.connect,
      pool,
      options,
      implementation.metaApi[key]
    )
    return acc
  }, {})

  const storeApi = Object.keys(implementation.storeApi).reduce((acc, key) => {
    acc[key] = bindWithConnection(
      implementation.metaApi.connect,
      pool,
      options,
      implementation.storeApi[key]
    )
    return acc
  }, {})

  return { metaApi, storeApi }
}

export default wrapApis
