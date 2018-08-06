const getMetaInfo = async (pool, checkStoredTableSchema) => {
  const metaCollection = await pool.connection.collection(pool.metaName)
  pool.metaInfo = { tables: {}, timestamp: 0 }

  let { timestamp } =
    (await metaCollection.findOne({
      key: 'timestamp'
    })) || {}

  if (!Number.isInteger(timestamp) || timestamp < 0) {
    await metaCollection.update(
      { key: 'timestamp' },
      { key: 'timestamp', timestamp: 0 },
      { upsert: true }
    )
  } else {
    pool.metaInfo.timestamp = timestamp
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
      `Can't table "${tableName}" meta information due invalid schema: ${JSON.stringify(
        tableDescription
      )}`
    )

    await metaCollection.remove({ key: 'tableDescription', tableName })
  }
}

const getLastTimestamp = async ({ metaInfo }) => metaInfo.timestamp

const setLastTimestamp = async (
  { metaInfo, connection, metaName },
  timestamp
) => {
  const metaCollection = await connection.collection(metaName)

  await metaCollection.update(
    { key: 'timestamp' },
    { key: 'timestamp', timestamp }
  )

  metaInfo.timestamp = +timestamp
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
  const metaCollection = await connection.collection(metaName)

  await metaCollection.insert({
    key: 'tableDescription',
    tableName,
    tableDescription: metaSchema
  })

  metaInfo.tables[tableName] = metaSchema
}

const getTableNames = async ({ metaInfo }) => Object.keys(metaInfo.tables)

const drop = async ({ metaInfo, connection, metaName }) => {
  for (let tableName of [...Object.keys(metaInfo.tables), metaName]) {
    const collection = await connection.collection(tableName)
    await collection.drop()
  }

  for (let key of Object.keys(metaInfo)) {
    delete metaInfo[key]
  }
}

export default {
  getMetaInfo,
  getLastTimestamp,
  setLastTimestamp,
  tableExists,
  getTableInfo,
  describeTable,
  getTableNames,
  drop
}
