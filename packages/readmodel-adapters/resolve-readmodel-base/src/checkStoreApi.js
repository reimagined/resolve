import messages from './messages'

const checkFieldName = name => {
  if ((!/^\w(?:\w|\.)*?$/, test(name))) {
    throw new Error(messages.invalidFieldName(name))
  }
}

const checkOptionShape = (option, types, count) => {
  return !(
    option === null ||
    option === undefined ||
    !types.reduce((acc, type) => acc || option.constructor === type, false)
  )
}

const checkStorageSchemaAndGetIndexes = storageSchema => {
  if (!Array.isArray(storageSchema)) {
    throw new Error(messages.invalidStorageSchema)
  }

  const validTypes = ['number', 'string', 'datetime', 'json']
  const indexRoles = ['primary', 'secondary']
  let primaryIndex = null
  const secondaryIndexes = []

  for (let rowDescription of storageSchema) {
    if (checkOptionShape(rowDescription, [Object])) {
      throw new Error(messages.invalidStorageSchema)
    }

    const { name, type, index } = rowDescription
    checkFieldName(name)
    if (validTypes.indexOf(type) < 0 || (index && indexRoles.indexOf(index) < 0)) {
      throw new Error(messages.invalidStorageSchema)
    }

    if (index === 'primary') {
      if (type !== 'number' && type !== 'string') {
        throw new Error(messages.invalidStorageSchema)
      }
      primaryIndex = { name, type }
    } else if (index === 'secondary') {
      secondaryIndexes.push({ name, type })
    }
  }

  if (!primaryIndex) {
    throw new Error(messages.invalidStorageSchema)
  }

  return { primaryIndex, secondaryIndexes }
}

const checkFieldList = (metaInfo, fieldList) => {
  if (!Array.isArray(fieldList)) {
    throw new Error(messages.fieldListNotArray)
  }
  for (let fieldName of fieldList) {
    checkFieldName(fieldName)
    const [baseName, ...nestedName] = fieldName.split('.')

    if (!metaInfo.fields[baseName]) {
      throw new Error(messages.invalidProjectionKey(fieldName))
    }

    if (nestedName.length > 0 && metaInfo.fields[baseName].type !== 'json') {
      throw new Error(messages.invalidProjectionKey(fieldName))
    }
  }
}

const boxingTypesMap = new Map([
  [Number, 'number'],
  [String, 'string'],
  [Date, 'datetime'],
  [Array, 'json'],
  [Object, 'json']
])

const checkDocumentShape = (metaInfo, document) => {
  if (!checkOptionShape(document, [Object])) {
    throw new Error(messages.invalidDocumentShape(document))
  }
  const documentKeys = Object.keys(document)

  if (Object.keys(metaInfo.fields).length !== documentKeys.length) {
    throw new Error(messages.invalidDocumentShape(document))
  }

  for (let fieldName of documentKeys) {
    if (document[fieldName] === null && metaInfo.fields[fieldName] === 'json') continue

    if (
      !metaInfo.fields[fieldName] ||
      document[fieldName] == null ||
      boxingTypesMap.get(document[fieldName].constructor) !== metaInfo.fields[fieldName].type
    ) {
      throw new Error(messages.invalidDocumentShape(document))
    }
  }
}

const checkSearchExpression = (metaInfo, searchExpression) => {
  if (!checkOptionShape(searchExpression, [Object])) {
    throw new Error(messages.invalidSearchExpression(searchExpression))
  }

  // todo: implement me!
}

const checkUpdateExpression = (metaInfo, updateExpression) => {
  if (!checkOptionShape(updateExpression, [Object])) {
    throw new Error(messages.invalidUpdateExpression(updateExpression))
  }

  const operators = Object.keys(updateExpression).filter(key => key.indexOf('$') > -1)
  if (operators.length === 0) {
    checkDocumentShape(metaInfo, updateExpression)
    return
  }

  if (operators.length !== Object.keys(updateExpression).length) {
    throw new Error(messages.invalidUpdateExpression(updateExpression))
  }

  const allowedOperators = ['$set', '$unset', '$inc', '$push', '$pull']
  for (let key of operators) {
    if (!allowedOperators.includes(key)) {
      throw new Error(messages.invalidUpdateExpression(updateExpression))
    }
  }

  //
  // TODO: Implement UPDATE operator compilance with underlying type
  //
}

const checkStorageExists = (metaApi, storageName) => {
  if (!metaApi.storageExists(storageName)) {
    throw new Error(messages.storageNotExist(storageName))
  }
}

const createStorage = async ({ metaApi, storeApi }, storageName, storageSchema) => {
  if (metaApi.storageExists(storageName)) {
    throw new Error(messages.storageExists(storageName))
  }
  const indexes = checkStorageSchemaAndGetIndexes(storageSchema)
  await storeApi.createStorage(storageName, storageSchema)
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
  resultFieldsList,
  sortFieldsList,
  skip = 0,
  limit = Infinity
) => {
  checkStorageExists(metaApi, storageName)

  const metaInfo = await metaApi.getStorageInfo(storageName)
  checkFieldList(metaInfo, resultFieldsList)
  checkFieldList(metaInfo, sortFieldsList)
  checkSearchExpression(metaInfo, searchExpression)

  if (!Number.isInteger(skip) || !(Number.isInteger(limit) || limit === Infinity)) {
    throw new Error(messages.invalidPagination(skip, limit))
  }

  return await storeApi.find(
    storageName,
    searchExpression,
    resultFieldsList,
    sortFieldsList,
    skip,
    limit
  )
}

const insert = async ({ metaApi, storeApi }, storageName, document) => {
  checkStorageExists(metaApi, storageName)
  const metaInfo = await metaApi.getStorageInfo(storageName)
  checkDocumentShape(metaInfo, document)
  await storeApi.insert(storageName, document)
}

const update = async ({ metaApi, storeApi }, storageName, searchExpression, updateExpression) => {
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
