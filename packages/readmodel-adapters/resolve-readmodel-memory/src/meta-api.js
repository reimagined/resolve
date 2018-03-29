const getLastTimestamp = async ({ metaInfo }) => metaInfo.timestamp

const setLastTimestamp = async ({ metaInfo }, timestamp) =>
  (metaInfo.timestamp = +timestamp)

const storageExists = async ({ metaInfo }, storageName) =>
  !!metaInfo.tables[storageName]

const getStorageInfo = async ({ metaInfo }, storageName) =>
  metaInfo.tables[storageName]

const describeStorage = async ({ metaInfo }, storageName, metaSchema) =>
  (metaInfo.tables[storageName] = metaSchema)

const getStorageNames = async ({ metaInfo }) => Object.keys(metaInfo.tables)

const clearObjects = (...objs) =>
  objs.forEach(obj =>
    Object.keys(obj).forEach(key => Reflect.deleteProperty(obj, key))
  )

const drop = async ({ storage, metaInfo }) => clearObjects(storage, metaInfo)

export default {
  getLastTimestamp,
  setLastTimestamp,
  storageExists,
  getStorageInfo,
  describeStorage,
  getStorageNames,
  drop
}
