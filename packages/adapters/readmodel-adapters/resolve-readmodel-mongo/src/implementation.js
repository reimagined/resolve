const implementation = (
  rawMetaApi,
  storeApi,
  MongoClient,
  { metaName, checkStoredTableSchema, ...options }
) => {
  const { getMetaInfo, ...metaApi } = rawMetaApi

  const connectionOptions = {
    url: options.url || 'mongodb://127.0.0.1:27017/',
    databaseName: options.databaseName || 'admin'
  }

  const pool = { metaName }
  let connectionPromise = null

  const bindWithConnection = func => async (...args) => {
    if (!connectionPromise) {
      connectionPromise = Promise.resolve()
        .then(async () => {
          const client = await MongoClient.connect(connectionOptions.url)
          pool.connection = await client.db(connectionOptions.databaseName)
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
