import messages from './messages'

const checkStorageSchema = () => {
  // todo: implement me!
}

const getIndexesFromSchema = storageSchema => {
  // todo: implement me!
}

const checkFieldList = (metaInfo, fieldList) => {
    if (!Array.isArray(fieldList)) {
        throw new Error(messages.fieldListNotArray)
    }
}

const checkSearchExpression = (metaInfo, searchExpression) => {
  // todo: implement me!
}

const checkUpdateExpression = (metaInfo, updateExpression) => {
  // todo: implement me!
}

const checkStorageExists = (metaApi, storageName) => {
  if (!metaApi.storageExists(storageName)) {
    throw new Error(messages.storageNotExist(storageName))
  }
}

const createStorage = async (
  { metaApi, storeApi },
  storageName,
  storageSchema
) => {
  if (metaApi.storageExists(storageName)) {
    throw new Error(messages.storageExists(storageName))
  }
  const validStorageSchema = checkStorageSchema(storageSchema)
  const indexes = getIndexesFromSchema(storageSchema)

  await storeApi.createStorage(storageName, validStorageSchema)
  await metaApi.addStorage(storageName, indexes)
}

const dropStorage = async ({ metaApi, storeApi }, storageName) => {
  checkStorageExists(metaApi, storageName)

  await storeApi.dropStorage(storageName)
  await metaApi.removeStorage(storageName)
}

const find = async (
  { metaApi, storeApi },
  storageName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {
  checkStorageExists(metaApi, storageName)
  
  const metaInfo = await metaApi.getStorageInfo(storageName)
  checkFieldList(metaInfo, fieldList)
  checkSearchExpression(metaInfo, searchExpression)
  
  return await storeApi.find(storageName, searchExpression, fieldList, sort, skip, limit)
}

const insert = async ({ metaApi, storeApi }, storageName, document) => {
  checkStorageExists(metaApi, storageName)

  await storeApi.insert(storageName, document)
}

const update = async (
  { metaApi, storeApi },
  storageName,
  searchExpression,
  updateExpression
) => {
  checkStorageExists(metaApi, storageName)

  const metaInfo = await metaApi.getStorageInfo(storageName)
  checkSearchExpression(metaInfo, searchExpression)
  checkUpdateExpression(metaInfo, updateExpression)

  await storeApi.update(storageName, searchExpression, updateExpression)
}

const del = async ({ metaApi, storeApi }, storageName, searchExpression) => {
  checkStorageExists(metaApi, storageName)

  const metaInfo = await metaApi.getStorageInfo(storageName)
  checkSearchExpression(metaInfo, searchExpression)

  await storeApi.delete(storageName, searchExpression)
}

const checkStoreApi = pool => {
  return Object.freeze({
    createStorage: createStorage.bind(null, pool),
    dropStorage: dropStorage.bind(null, pool),
    find: find.bind(null, pool),
    insert: insert.bind(null, pool),
    update: update.bind(null, pool),
    delete: del.bind(null, pool)
  })
}

export default checkStoreApi
