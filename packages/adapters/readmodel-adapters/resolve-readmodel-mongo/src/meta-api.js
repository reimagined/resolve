const connect = async (MongoClient, pool, options) => {
  const {
    checkStoredTableSchema,
    metaName,
    url,
    ...connectionOptions
  } = options

  const connection = await MongoClient.connect(
    url,
    { ...connectionOptions, useNewUrlParser: true }
  )

  const db = await connection.db()
  const collections = await db.collections()
  let metaCollection = null

  if (!collections.map(c => c.s.name).includes(metaName)) {
    await db.createCollection(metaName)
    metaCollection = await db.collection(metaName)
    await metaCollection.createIndex('key')
    await metaCollection.createIndex('aggregateId')
  } else {
    metaCollection = await db.collection(metaName)
  }

  pool.metaInfo = { tables: {}, timestamp: 0, aggregatesVersionsMap: new Map() }

  let { timestamp } =
    (await metaCollection.findOne({
      key: 'timestamp'
    })) || {}

  if (!Number.isInteger(timestamp) || timestamp < 0) {
    await metaCollection.updateOne(
      { key: 'timestamp' },
      { $set: { key: 'timestamp', timestamp: 0 } },
      { upsert: true }
    )
  } else {
    pool.metaInfo.timestamp = timestamp
  }

  const aggregatesVersionsArray = await (await metaCollection.find({
    key: 'aggregatesVersionsMap'
  })).toArray()

  for (let { aggregateId, aggregateVersion } of aggregatesVersionsArray) {
    pool.metaInfo.aggregatesVersionsMap.set(aggregateId, aggregateVersion)
  }

  const tables = await (await metaCollection.find({
    key: 'tableDescription'
  })).toArray()

  for (let { tableName, tableDescription } of tables) {
    if (checkStoredTableSchema(tableName, tableDescription)) {
      pool.metaInfo.tables[tableName] = tableDescription
      continue
    }

    // eslint-disable-next-line no-console
    console.log(
      `Can't restore table "${tableName}" meta information due invalid schema: ${JSON.stringify(
        tableDescription
      )}`
    )

    await metaCollection.deleteMany({ key: 'tableDescription', tableName })
  }

  Object.assign(pool, {
    metaName,
    connection
  })
}

const getLastTimestamp = async ({ metaInfo }) => metaInfo.timestamp

const setLastTimestamp = async (
  { metaInfo, connection, metaName },
  timestamp
) => {
  const db = await connection.db()
  const metaCollection = await db.collection(metaName)

  await metaCollection.updateOne(
    { key: 'timestamp' },
    { $set: { key: 'timestamp', timestamp } }
  )

  metaInfo.timestamp = +timestamp
}

const setLastAggregateVersion = async (
  { metaInfo, connection, metaName },
  aggregateId,
  aggregateVersion
) => {
  const db = await connection.db()
  const metaCollection = await db.collection(metaName)

  await metaCollection.updateOne(
    { key: 'aggregatesVersionsMap', aggregateId },
    { $set: { key: 'aggregatesVersionsMap', aggregateId, aggregateVersion } },
    { upsert: true }
  )

  metaInfo.aggregatesVersionsMap.set(aggregateId, aggregateVersion)
}

const getLastAggregatesVersions = async ({ metaInfo }) => {
  return metaInfo.aggregatesVersionsMap
}

const tableExists = async ({ metaInfo }, tableName) =>
  !!metaInfo.tables[tableName]

const getTableInfo = async ({ metaInfo }, tableName) =>
  metaInfo.tables[tableName]

const describeTable = async (
  { metaInfo, connection, metaName },
  tableName,
  metaSchema
) => {
  const db = await connection.db()
  const metaCollection = await db.collection(metaName)

  await metaCollection.insertOne({
    key: 'tableDescription',
    tableName,
    tableDescription: metaSchema
  })

  metaInfo.tables[tableName] = metaSchema
}

const getTableNames = async ({ metaInfo }) => Object.keys(metaInfo.tables)

const disconnect = async ({ connection }) => {
  await connection.close()
}

const drop = async (
  { metaInfo, connection, metaName },
  { dropMetaTable, dropDataTables } = {}
) => {
  const db = await connection.db()

  if (dropDataTables) {
    for (let tableName of Object.keys(metaInfo.tables)) {
      const collection = await db.collection(tableName)
      await collection.drop()
    }
  }

  if (dropMetaTable) {
    const metaCollection = await db.collection(metaName)
    await metaCollection.drop()

    for (let key of Object.keys(metaInfo)) {
      delete metaInfo[key]
    }
  }
}

export default {
  connect,
  getLastTimestamp,
  setLastTimestamp,
  setLastAggregateVersion,
  getLastAggregatesVersions,
  tableExists,
  getTableInfo,
  describeTable,
  getTableNames,
  disconnect,
  drop
}
