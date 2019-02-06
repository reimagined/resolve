const connect = async (NeDB, pool, options) => {
  const {
    checkStoredTableSchema,
    tablePrefix,
    metaName,
    ...advancedOptions
  } = options

  Object.assign(pool, {
    createTable: () => new NeDB({ autoload: true }),
    readModels: new Map(),
    demandInfo: new Map(),
    checkStoredTableSchema,
    tablePrefix,
    metaName,
    ...advancedOptions
  })

  pool.getReadModel = readModelName => {
    if (!pool.readModels.has(readModelName)) {
      pool.readModels.set(readModelName, {
        aggregateVersionsMap: new Map(),
        tablesInfo: new Map(),
        timestamp: null,
        content: new Map()
      })
    }

    return pool.readModels.get(readModelName)
  }
}

const reportDemandAccess = async ({ demandInfo }, readModelName) => {
  demandInfo.set(readModelName, +Date.now())
}

const pollDemandAccess = async ({ demandInfo }, readModelName) => {
  const timestamp = demandInfo.get(readModelName)
  return timestamp != null ? timestamp : 0
}

const checkAndAcquireSequence = async (
  { getReadModel },
  readModelName,
  aggregateId,
  aggregateVersion,
  maybeUnordered
) => {
  const aggregateVersionsMap = getReadModel(readModelName).aggregateVersionsMap
  const storedVersion = aggregateVersionsMap.get(aggregateId)

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

  aggregateVersionsMap.set(aggregateId, +aggregateVersion)

  return null
}

const checkEventProcessed = async (
  { getReadModel },
  readModelName,
  aggregateId,
  aggregateVersion
) => {
  const aggregateVersionsMap = getReadModel(readModelName).aggregateVersionsMap
  const storedVersion = aggregateVersionsMap.get(aggregateId)
  return storedVersion >= aggregateVersion
}

const getLastTimestamp = async ({ getReadModel }, readModelName) => {
  return getReadModel(readModelName).timestamp
}

const setLastTimestamp = async ({ getReadModel }, readModelName, timestamp) => {
  getReadModel(readModelName).timestamp = +timestamp
}

const beginTransaction = async () => true
const commitTransaction = async () => null
const rollbackTransaction = async () => null

const tableExists = async ({ getReadModel }, readModelName, tableName) => {
  return getReadModel(readModelName).tablesInfo.has(tableName)
}

const getTableInfo = async ({ getReadModel }, readModelName, tableName) => {
  return getReadModel(readModelName).tablesInfo.get(tableName)
}

const describeTable = async (
  { getReadModel },
  readModelName,
  tableName,
  metaSchema
) => {
  getReadModel(readModelName).tablesInfo.set(tableName, metaSchema)
}

const dropReadModel = async ({ readModels }, readModelName) => {
  readModels.delete(readModelName)
}

const drop = async (pool, { dropDataTables, dropMetaTable }) => {
  if (dropDataTables) {
    for (const key of Array.from(pool.readModels.keys())) {
      const readModel = pool.readModels.get(key)
      readModel.content.clear()
    }
  }
  if (dropMetaTable) {
    pool.readModels.clear()
  }
}

const disconnect = async () => null

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
