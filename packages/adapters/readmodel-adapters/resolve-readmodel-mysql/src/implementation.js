const implementation = (
  rawMetaApi,
  storeApi,
  mysql,
  escapeId,
  { metaName, checkStoredTableSchema, ...connectionOptions }
) => {
  const { getMetaInfo, ...metaApi } = rawMetaApi

  const pool = { escapeId, metaName }
  let connectionPromise = null

  const bindWithConnection = func => async (...args) => {
    if (!connectionPromise) {
      connectionPromise = Promise.resolve()
        .then(() => mysql.createConnection(connectionOptions))
        .then(async connection => {
          pool.connection = connection
          await getMetaInfo(pool, checkStoredTableSchema)
        })
        .catch(error => error)
    }

    const connectionResult = await connectionPromise
    if (connectionResult instanceof Error) {
      throw connectionResult
    }

    return await func(pool, ...args)
  }

  return {
    metaApi: Object.keys(metaApi).reduce((acc, key) => {
      acc[key] = bindWithConnection(metaApi[key])
      return acc
    }, {}),

    storeApi: Object.keys(storeApi).reduce((acc, key) => {
      acc[key] = bindWithConnection(storeApi[key])
      return acc
    }, {})
  }
}

export default implementation
