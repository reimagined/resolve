import 'regenerator-runtime/runtime'

const implementation = (
  rawMetaApi,
  storeApi,
  mysql,
  { metaName, ...options }
) => {
  const { getMetaInfo, ...metaApi } = rawMetaApi

  const connectionOptions = {
    host: options.host || '127.0.0.1',
    port: options.port || 3306,
    user: options.user || 'root',
    password: options.password || '',
    database: options.database || 'temp'
  }

  const pool = { metaName }
  let connectionPromise = null

  const bindWithConnection = func => async (...args) => {
    if (!connectionPromise) {
      connectionPromise = mysql
        .createConnection(connectionOptions)
        .then(async connection => {
          pool.connection = connection
          await getMetaInfo(pool)
        })
    }

    await connectionPromise
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
