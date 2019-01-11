const lockConnectionExclusive = async (pool, readModelName) => {
  while (Promise.resolve(pool.lockPromise) === pool.lockPromise) {
    await pool.lockPromise
  }
  pool.affectedReadModel = readModelName
  pool.hasPerformedMutations = false

  pool.lockPromise = new Promise(resolve => {
    pool.unlockConnection = () => {
      pool.affectedReadModel = null
      pool.hasPerformedMutations = null
      pool.lockPromise = null
      resolve()
    }
  })
}

const dropScopeName = '@@__DROP_SCOPE_NAME__@@'

const seizeDatabaseLock = async (pool, readModelName) => {
  const database = await pool.databasePromise
  const metaCollection = await database.collection(
    `${pool.tablePrefix}${pool.metaName}`
  )
  const currentTimestamp = Date.now()

  try {
    await metaCollection.deleteMany({
      readModelLock: { $exists: true },
      connectionId: { $ne: pool.connectionId },
      timestamp: { $lt: currentTimestamp - 60 }
    })
  } catch (err) {}

  try {
    const insertedDocs = [
      {
        readModelLock: readModelName,
        connectionId: pool.connectionId,
        timestamp: currentTimestamp
      }
    ]
    if (readModelName !== dropScopeName) {
      insertedDocs.push({
        readModelLock: dropScopeName,
        connectionId: pool.connectionId,
        timestamp: currentTimestamp
      })
    }

    const { insertedCount } = await metaCollection.insertMany(insertedDocs)
    if (insertedCount !== insertedDocs.length) {
      await metaCollection.deleteMany({
        readModelLock: { $in: [readModelName, dropScopeName] },
        connectionId: { $ne: pool.connectionId }
      })

      throw new Error('Lock does not acquired')
    }

    return
  } catch (err) {}

  throw new Error(`Multi-thread access error to read-model ${readModelName}`)
}

const releaseDatabaseLock = async (pool, readModelName) => {
  await pool.metaCollection.deleteMany({
    readModelLock: { $in: [readModelName, dropScopeName] },
    connectionId: pool.connectionId
  })
}

const dropReadModel = async (
  pool,
  readModelName,
  skipConnectionLocking = false
) => {
  if (!skipConnectionLocking) {
    await lockConnectionExclusive(pool, readModelName)
  }

  try {
    pool.tableInfoCache.delete(readModelName)
    const database = await pool.databasePromise
    await seizeDatabaseLock(pool, readModelName)

    const tableNames = (await pool.metaCollection
      .find({
        key: `tableDescription`,
        readModelName
      })
      .toArray()).map(doc => doc.tableName)

    for (const tableName of tableNames) {
      await database.dropCollection(tableName)
    }

    await pool.metaCollection.deleteMany({ readModelName })

    await releaseDatabaseLock(pool, readModelName)
  } catch (error) {
    await releaseDatabaseLock(pool, readModelName)
    throw error
  } finally {
    if (!skipConnectionLocking) {
      pool.unlockConnection()
    }
  }
}

const setupConnection = async pool => {
  pool.connectionId = null
  pool.databasePromise = new Promise((resolve, reject) => {
    pool.MongoClient.connect(
      pool.url,
      {
        ...pool.connectionOptions,
        useNewUrlParser: true,
        autoReconnect: false
      },
      (error, client) => {
        if (error != null) {
          return reject(error)
        }
        try {
          pool.connection = client
          return resolve(client.db())
        } catch (error) {
          return reject(error)
        }
      }
    )
  })

  try {
    await pool.databasePromise
    pool.connectionId = `CID-${Math.random()}`
  } catch (error) {
    if (error.code === 'CONNECTION_LOST') {
      Promise.resolve().then(setupConnection.bind(null, pool))
      return
    }

    pool.lastMongodbError = error
    // eslint-disable-next-line no-console
    console.warn('MongoDB error: ', error)
  }
}

const connect = async (MongoClient, pool, options) => {
  const {
    checkStoredTableSchema,
    tablePrefix,
    metaName,
    url,
    ...connectionOptions
  } = options

  Object.assign(pool, {
    tableInfoCache: new Map(),
    checkStoredTableSchema,
    connectionOptions,
    tablePrefix,
    metaName,
    MongoClient,
    url
  })

  await setupConnection(pool)
  const database = await pool.databasePromise

  try {
    const metaCollection = await database.createCollection(
      `${pool.tablePrefix}${pool.metaName}`
    )

    await metaCollection.createIndex(
      { readModelLock: 1 },
      {
        name: 'readModelLock',
        sparse: true,
        unique: true
      }
    )

    await metaCollection.createIndex(
      {
        readModelName: 1,
        key: 1
      },
      {
        name: 'readModelSchema'
      }
    )
  } catch (err) {}

  pool.metaCollection = await database.collection(
    `${pool.tablePrefix}${pool.metaName}`
  )
}

const beginTransaction = async (pool, readModelName, onlyLocal = false) => {
  await lockConnectionExclusive(pool, readModelName)
  if (onlyLocal) {
    return null
  }
  try {
    await seizeDatabaseLock(pool, readModelName)
    return true
  } catch (error) {
    await releaseDatabaseLock(pool, readModelName)
    pool.unlockConnection()
    return false
  }
}

const commitTransaction = async (pool, readModelName, onlyLocal = false) => {
  if (onlyLocal) {
    pool.unlockConnection()
    return
  }
  try {
    await releaseDatabaseLock(pool, readModelName)
  } finally {
    pool.unlockConnection()
  }
}

const rollbackTransaction = async (pool, readModelName, onlyLocal = false) => {
  if (onlyLocal) {
    pool.unlockConnection()
    return
  }
  try {
    await releaseDatabaseLock(pool, readModelName)
    if (pool.hasPerformedMutations) {
      // eslint-disable-next-line no-console
      console.log('Transaction failed so read-model has been reverted')
      await dropReadModel(pool, readModelName, true)
    }
  } finally {
    pool.unlockConnection()
  }
}

const reportDemandAccess = async ({ metaCollection }, readModelName) => {
  await metaCollection.updateOne(
    { key: 'demandAccess', readModelName },
    { $set: { key: 'demandAccess', readModelName, timestamp: +Date.now() } },
    { upsert: true }
  )
}

const pollDemandAccess = async ({ metaCollection }, readModelName) => {
  const doc = await metaCollection.findOne({
    key: 'demandAccess',
    readModelName
  })

  return doc != null ? doc.timestamp : 0
}

const getLastTimestamp = async ({ metaCollection }, readModelName) => {
  const doc = await metaCollection.findOne({
    key: 'timestamp',
    readModelName
  })

  return doc != null ? doc.timestamp : null
}

const setLastTimestamp = async (
  { metaCollection },
  readModelName,
  timestamp
) => {
  await metaCollection.updateOne(
    { key: 'timestamp', readModelName },
    { $set: { key: 'timestamp', readModelName, timestamp } },
    { upsert: true }
  )
}

const getTableInfo = async (
  { metaCollection, tableInfoCache, checkStoredTableSchema },
  readModelName,
  tableName
) => {
  if (!tableInfoCache.has(readModelName)) {
    tableInfoCache.set(readModelName, new Map())
  }
  const currentCache = tableInfoCache.get(readModelName)
  if (currentCache.has(tableName)) {
    return currentCache.get(tableName)
  }

  const doc = await metaCollection.findOne({
    key: `tableDescription`,
    readModelName,
    tableName
  })
  if (doc == null) {
    return null
  }

  const tableDescription = doc.tableDescription
  if (!checkStoredTableSchema(tableName, tableDescription)) {
    throw new Error(
      `Can't restore "${tableName}" meta information due invalid schema: ${JSON.stringify(
        tableDescription
      )}`
    )
  }

  currentCache.set(tableName, tableDescription)

  return tableDescription
}

const tableExists = async (pool, readModelName, tableName) => {
  return !!(await getTableInfo(pool, readModelName, tableName))
}

const describeTable = async (
  { metaCollection },
  readModelName,
  tableName,
  metaSchema
) => {
  await metaCollection.insertOne({
    key: 'tableDescription',
    readModelName,
    tableName,
    tableDescription: metaSchema
  })
}

const checkAndAcquireSequence = async (
  { metaCollection },
  readModelName,
  aggregateId,
  aggregateVersion,
  maybeUnordered
) => {
  const doc = await metaCollection.findOne({
    key: 'aggregateVersionMap',
    readModelName,
    aggregateId
  })

  const storedVersion = doc != null ? doc.aggregateVersion : null
  if (storedVersion != null && aggregateVersion <= storedVersion) {
    return 'RETRANSMITTED_EVENT'
  }

  if (
    maybeUnordered &&
    !(
      storedVersion + 1 === aggregateVersion ||
      (storedVersion == null && aggregateVersion === 1)
    )
  ) {
    return 'REORDERED_EVENT'
  }

  await metaCollection.updateOne(
    {
      key: 'aggregateVersionMap',
      readModelName,
      aggregateId
    },
    { $set: { aggregateVersion } },
    { upsert: true }
  )

  return null
}

const checkEventProcessed = async (
  { metaCollection },
  readModelName,
  aggregateId,
  aggregateVersion
) => {
  const doc = await metaCollection.findOne({
    key: 'aggregateVersionMap',
    readModelName,
    aggregateId
  })

  const storedVersion = doc != null ? doc.aggregateVersion : null

  return storedVersion >= aggregateVersion
}

const disconnect = async ({ connection }) => {
  await connection.close()
}

const drop = async (pool, { dropMetaTable, dropDataTables }) => {
  try {
    pool.tableInfoCache.clear()

    await lockConnectionExclusive(pool, dropScopeName)
    await seizeDatabaseLock(pool, dropScopeName)

    const database = await pool.databasePromise

    if (dropDataTables === true) {
      const tableNames = (await pool.metaCollection
        .find({
          key: `tableDescription`
        })
        .toArray()).map(doc => doc.tableName)

      for (const tableName of tableNames) {
        await database.dropCollection(tableName)
      }
    }

    if (dropMetaTable) {
      await pool.metaCollection.drop()
    }

    await releaseDatabaseLock(pool, dropScopeName)
  } catch (error) {
    await releaseDatabaseLock(pool, dropScopeName)
    pool.unlockConnection()
    throw error
  }
}

export default {
  connect,
  reportDemandAccess,
  pollDemandAccess,
  checkAndAcquireSequence,
  checkEventProcessed,
  getLastTimestamp,
  setLastTimestamp,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  tableExists,
  getTableInfo,
  describeTable,
  dropReadModel,
  disconnect,
  drop
}
