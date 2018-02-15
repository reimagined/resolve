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
    `SELECT SimpleValue AS Timestamp FROM ${metaName} WHERE MetaKey="Timestamp" `
  )

  if (rows.length === 0) {
    await connection.execute(`INSERT INTO ${metaName}(MetaKey, SimpleValue) VALUES("Timestamp", 0)`)
  } else {
    pool.metaInfo.timestamp = +rows[0]['Timestamp']
  }

  let [rows] = await connection.execute(
    `SELECT MetaField AS TableName, ComplexValue AS TableDescription
     FROM ${metaName} WHERE MetaKey="Tables"`
  )
  for (let { TableName, TableDescription } of rows) {
    try {
      const descriptor = { fieldTypes: {}, primaryIndex: {}, secondaryIndexes: [] }
      for (let key of Object.keys(TableDescription.fieldTypes)) {
        descriptor.fieldTypes = TableDescription.fieldTypes[key]
      }

      descriptor.primaryIndex.name = TableDescription.primaryIndex.name
      descriptor.primaryIndex.type = TableDescription.primaryIndex.type

      for (let { name, type } of TableDescription.secondaryIndexes) {
        descriptor.secondaryIndexes.push({ name, type })
      }

      pool.metaInfo.tables[TableName] = descriptor
      continue
    } catch (err) {
      await connection.execute(`DELETE FROM ${metaName} WHERE MetaKey="Tables" AND MetaField=?`, [
        TableName
      ])
    }
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

const addStorage = async ({ connection, metaInfo, metaName }, storageName, metaSchema) => {
  await connection.execute(
    `INSERT INTO ${metaName}(MetaKey, MetaField, ComplexValue) VALUES("Tables", ?, ?)`,
    [storageName, metaSchema]
  )

  metaInfo.tables[storageName] = metaSchema
}

const removeStorage = async ({ connection, metaInfo, metaName }, storageName) => {
  await connection.execute(`DELETE FROM ${metaName} WHERE MetaKey="Tables" AND MetaField=?`, [
    storageName
  ])

  delete metaInfo.tables[storageName]
}

const getStorageNames = async ({ metaInfo }) => {
  return Object.keys(metaInfo.tables)
}

const drop = async ({ connection, metaName, metaInfo }) => {
  for (let tableName of Object.keys(metaInfo.tables)) {
    await connection.execute(`DROP TABLE ${tableName}`)
  }

  await connection.execute(`DROP TABLE ${metaName}`)

  for (let key of Object.keys(metaInfo)) {
    delete metaInfo[key]
  }
}

const castType = type => {
  switch (type) {
    case 'number':
      return 'BIGINT NOT NULL'
    case 'string':
      return 'MEDIUMTEXT NOT NULL'
    case 'datetime':
      return 'DATETIME NOT NULL'
    case 'json':
      return 'JSON NULL'
    default:
      return 'MEDIUMBLOB NULL'
  }
}

const createStorage = async ({ connection }, storageName, storageSchema) => {
  await connection.execute(
    `CREATE TABLE ${storageName} (\n` +
      [
        Object.keys(storageSchema.fieldTypes)
          .map(fieldName => `${fieldName} ${castType(storageSchema.fieldTypes[fieldName])}`)
          .join(',\n'),

        `PRIMARY INDEX (${storageSchema.primaryIndex.name})`,

        storageSchema.secondaryIndexes.map(({ name }) => `INDEX USING BTREE (${name})`).join(',\n')
      ].join(',\n') +
      `\n)`
  )
}

const dropStorage = async ({ connection }, storageName) => {
  await connection.execute(`DROP TABLE ${storageName}`)
}

const find = async (
  { connection },
  storageName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {}

const insert = async ({ connection }, storageName, document) => {}

const update = async ({ connection }, storageName, searchExpression, updateExpression) => {}

const del = async ({ connection }, storageName, searchExpression) => {}

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
    createStorage: bindWithConnection(createStorage),
    dropStorage: bindWithConnection(dropStorage),
    find: bindWithConnection(find),
    insert: bindWithConnection(insert),
    update: bindWithConnection(update),
    delete: bindWithConnection(del)
  }

  return { metaApi, storeApi }
}

const createMysqlAdapter = createAdapter.bind(null, implMysql)

export default createMysqlAdapter
