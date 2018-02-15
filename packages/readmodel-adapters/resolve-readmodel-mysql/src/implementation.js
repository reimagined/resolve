import 'regenerator-runtime/runtime'
import mysql from 'mysql2/promise'

import rawMetaApi from './meta-api'
import storeApi from './store-api'

const { getMetaInfo, ...metaApi } = rawMetaApi

const implementation = ({ metaName, ...options }) => {
  const connectionOptions = {
    host: options.host || '127.0.0.1',
    port: options.port || 3306,
    user: options.user || 'root',
    password: options.password || '',
    database: options.database || 'temp'
  }

  const pool = { metaName }
  let connectionPromise = mysql.createConnection(connectionOptions).then(async connection => {
    pool.connection = connection
    await getMetaInfo(pool)
  })

  const bindWithConnection = func => async (...args) => {
    await connectionPromise
    return await func(pool, ...args)
  }

  return {
    metaApi: Object.keys(metaApi).map(key => bindWithConnection(metaApi[key])),
    storeApi: Object.keys(storeApi).map(key => bindWithConnection(storeApi[key]))
  }
}

export default implementation
