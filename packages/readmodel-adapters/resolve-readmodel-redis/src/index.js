import 'regenerator-runtime/runtime'
import createAdapter from 'resolve-readmodel-base'
import mysql from 'mysql2/promise'

const getMetaInfo = async pool => {
  const { connection, metaName } = pool

  await connection.execute(`CREATE TABLE IF NOT EXISTS ${metaName} (
      MetaKey VARCHAR(36) NOT NULL,
      MetaField VARCHAR(128) NULL,
      SimpleValue BIGINT NULL,
      ComplexValue JSON NULL
      PRIMARY KEY (MetaKey, MetaField)
    )`)

  pool.metaInfo = { tables: {}, timestamp: 0 }

  let [rows] = await connection.execute(
    `SELECT SimpleValue FROM ${metaName} WHERE MetaKey="Timestamp" `
  )

  if (rows.length === 0) {
    await connection.execute(`INSERT INTO ${metaName}(MetaKey, SimpleValue) VALUES("Timestamp", 0)`)
  } else {
    pool.metaInfo.timestamp = +rows[0]['SimpleValue']
  }

  let [rows] = await connection.execute(
    `SELECT MetaField, ComplexValue FROM ${metaName} WHERE MetaKey="Tables"`
  )
  for (let { MetaField, ComplexValue } of rows) {
    if (
      MetaField &&
      MetaField.constructor === String &&
      ComplexValue &&
      ComplexValue.constructor === Object &&
      ComplexValue.hasOwnProperty('name') &&
      ComplexValue.hasOwnProperty('fields') &&
      ComplexValue.hasOwnProperty('primaryIndex') &&
      ComplexValue.hasOwnProperty('secondaryIndexes') &&
      ComplexValue.name &&
      ComplexValue.name.constructor === String &&
      ComplexValue.fields &&
      Array.isArray(ComplexValue.fields) &&
      ComplexValue.primaryIndex &&
      ComplexValue.primaryIndex.constructor === String &&
      ComplexValue.secondaryIndexes &&
      Array.isArray(ComplexValue.secondaryIndexes)
    ) {
      pool.metaInfo.tables[MetaField] = ComplexValue
      continue
    }

    await await connection.execute(
      `DELETE FROM ${metaName} WHERE MetaKey="Tables" AND MetaField=?`,
      [MetaField]
    )
  }
}

const getLastTimestamp = async ({ metaInfo }) => {
  return metaInfo.timestamp
}

const setLastTimestamp = async ({ connection, metaName, metaInfo }, timestamp) => {
  await connection.execute(`UPDATE ${metaName} SET SimpleValue=? WHERE MetaKey="Timestamp"`, [
    timestamp
  ])

  metaInfo.timestamp = +timestamp
}

const storageExists = async ({ metaInfo }, storageName) => {
  return !!metaInfo.tables[storageName]
}

const getStorageInfo = async ({ metaInfo }, storageName) => {
  return metaInfo.tables[storageName]
}

const addStorage = async ({ connection }, storageName, indexes) => {}

const removeStorage = async ({ connection }, storageName) => {}

const getStorageNames = async ({ metaInfo }) => {
  return Object.keys(metaInfo.tables)
}

const drop = async ({ connection }) => {}

const dropStorage = async ({ connection }) => {}

const implMysql = ({ metaName, ...options }) => {
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

  const metaApi = {
    getLastTimestamp: bindWithConnection(getLastTimestamp),
    setLastTimestamp: bindWithConnection(setLastTimestamp),
    getStorageInfo: bindWithConnection(getStorageInfo),
    storageExists: bindWithConnection(storageExists),
    addStorage: bindWithConnection(addStorage),
    removeStorage: bindWithConnection(removeStorage),
    getStorageNames: bindWithConnection(getStorageNames),
    drop: bindWithConnection(drop)
  }

  const storeApi = {
    dropStorage: bindWithConnection(dropStorage)
  }

  return { metaApi, storeApi }
}

const createMysqlAdapter = createAdapter.bind(null, implMysql)

export default createMysqlAdapter
