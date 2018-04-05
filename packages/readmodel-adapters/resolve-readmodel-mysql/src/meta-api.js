const getMetaInfo = async pool => {
  const { connection, metaName } = pool

  await connection.execute(`CREATE TABLE IF NOT EXISTS ${metaName} (
      MetaKey VARCHAR(36) NOT NULL,
      MetaField VARCHAR(128) NOT NULL,
      SimpleValue BIGINT NULL,
      ComplexValue JSON NULL,
      PRIMARY KEY (MetaKey, MetaField)
    )`)

  pool.metaInfo = { tables: {}, timestamp: 0 }

  let [rows] = await connection.execute(
    `SELECT SimpleValue AS Timestamp FROM ${metaName}
     WHERE MetaKey="Timestamp" AND MetaField="Timestamp"`
  )

  if (rows.length === 0) {
    await connection.execute(
      `INSERT INTO ${metaName}(MetaKey, MetaField, SimpleValue)
       VALUES("Timestamp", "Timestamp", 0)`
    )
  } else {
    pool.metaInfo.timestamp = Number.isInteger(+rows[0]['Timestamp'])
      ? +rows[0]['Timestamp']
      : 0
  }

  void ([rows] = await connection.execute(
    `SELECT MetaField AS TableName, ComplexValue AS TableDescription
     FROM ${metaName} WHERE MetaKey="Tables"`
  ))

  for (let { TableName, TableDescription } of rows) {
    try {
      const descriptor = {
        fieldTypes: {},
        primaryIndex: {},
        secondaryIndexes: []
      }
      if (TableDescription.fieldTypes.constructor !== Object) {
        throw new Error('Malformed meta description')
      }
      for (let key of Object.keys(TableDescription.fieldTypes)) {
        descriptor.fieldTypes[key] = TableDescription.fieldTypes[key]
      }

      if (TableDescription.primaryIndex.constructor !== Object) {
        throw new Error('Malformed meta description')
      }
      descriptor.primaryIndex.name = TableDescription.primaryIndex.name
      descriptor.primaryIndex.type = TableDescription.primaryIndex.type

      if (!Array.isArray(TableDescription.secondaryIndexes)) {
        throw new Error('Malformed meta description')
      }
      for (let { name, type } of TableDescription.secondaryIndexes) {
        descriptor.secondaryIndexes.push({ name, type })
      }

      pool.metaInfo.tables[TableName] = descriptor
    } catch (err) {
      await connection.execute(
        `DELETE FROM ${metaName}
         WHERE MetaKey="Tables" AND MetaField=?`,
        [TableName]
      )
    }
  }
}

const getLastTimestamp = async ({ metaInfo }) => {
  return metaInfo.timestamp
}

const setLastTimestamp = async (
  { connection, metaName, metaInfo },
  timestamp
) => {
  await connection.execute(
    `UPDATE ${metaName} SET SimpleValue=? WHERE MetaKey="Timestamp"`,
    [timestamp]
  )

  metaInfo.timestamp = +timestamp
}

const storageExists = async ({ metaInfo }, storageName) => {
  return !!metaInfo.tables[storageName]
}

const getStorageInfo = async ({ metaInfo }, storageName) => {
  return metaInfo.tables[storageName]
}

const describeStorage = async (
  { connection, metaInfo, metaName },
  storageName,
  metaSchema
) => {
  await connection.execute(
    `INSERT INTO ${metaName}(MetaKey, MetaField, ComplexValue) VALUES("Tables", ?, ?)`,
    [storageName, metaSchema]
  )

  metaInfo.tables[storageName] = metaSchema
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

export default {
  getMetaInfo,
  getLastTimestamp,
  setLastTimestamp,
  storageExists,
  getStorageInfo,
  describeStorage,
  getStorageNames,
  drop
}
