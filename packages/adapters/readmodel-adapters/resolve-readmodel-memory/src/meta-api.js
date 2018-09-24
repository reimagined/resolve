const connect = async (NeDB, pool, options) => {
  pool.createTable = () => new NeDB({ autoload: true })

  if (options.metaInfo && options.metaInfo.constructor === Object) {
    pool.metaInfo = options.metaInfo
  } else {
    pool.metaInfo = {
      tables: {},
      timestamp: 0,
      aggregatesVersionsMap: new Map()
    }
  }

  if (options.storage && options.storage.constructor === Object) {
    pool.storage = options.storage
  } else {
    pool.storage = {}
  }
}

const getLastTimestamp = async ({ metaInfo }) => metaInfo.timestamp

const setLastTimestamp = async ({ metaInfo }, timestamp) =>
  (metaInfo.timestamp = +timestamp)

const setLastAggregateVersion = async (
  { metaInfo },
  aggregateId,
  aggregateVersion
) => metaInfo.aggregatesVersionsMap.set(aggregateId, aggregateVersion)

const getLastAggregatesVersions = async ({ metaInfo }) =>
  metaInfo.aggregatesVersionsMap

const tableExists = async ({ metaInfo }, tableName) =>
  !!metaInfo.tables[tableName]

const getTableInfo = async ({ metaInfo }, tableName) =>
  metaInfo.tables[tableName]

const describeTable = async ({ metaInfo }, tableName, metaSchema) =>
  (metaInfo.tables[tableName] = metaSchema)

const getTableNames = async ({ metaInfo }) => Object.keys(metaInfo.tables)

const clearObject = obj =>
  Object.keys(obj).forEach(key => Reflect.deleteProperty(obj, key))

const drop = async (
  { storage, metaInfo },
  { dropMetaTable, dropDataTables } = {}
) => {
  if (dropDataTables) {
    clearObject(storage)
  }
  if (dropMetaTable) {
    clearObject(metaInfo)
  }
}

const disconnect = async () => null

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
