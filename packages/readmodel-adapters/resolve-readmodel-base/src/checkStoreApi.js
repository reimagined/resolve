import messages from './messages'

const checkCondition = (condition, type, ...args) => {
  if (!condition) {
    const message = messages.hasOwnProperty(type)
      ? typeof messages[type] === 'function' ? messages[type](...args) : messages.type
      : `Unknown internal error ${type}: ${args}`

    throw new Error(message)
  }
}

const checkOptionShape = (option, types) => {
  return !(
    option == null || !types.reduce((acc, type) => acc || option.constructor === type, false)
  )
}

const checkAndGetStorageMetaSchema = storageSchema => {
  checkCondition(Array.isArray(storageSchema), 'invalidStorageSchema')

  const validTypes = ['number', 'string', 'datetime', 'json']
  const indexRoles = ['primary', 'secondary']
  let primaryIndex = null
  const secondaryIndexes = []
  const fieldTypes = {}

  for (let rowDescription of storageSchema) {
    checkCondition(checkOptionShape(rowDescription, [Object]), 'invalidStorageSchema')
    const { name, type, index } = rowDescription
    checkCondition(/^\w+?$/.test(name), 'invalidStorageSchema')
    checkCondition(
      validTypes.indexOf(type) < 0 || (index && indexRoles.indexOf(index) < 0),
      'invalidStorageSchema'
    )

    if (index === 'primary') {
      checkCondition(type !== 'number' && type !== 'string', 'invalidStorageSchema')
      primaryIndex = { name, type }
    } else if (index === 'secondary') {
      secondaryIndexes.push({ name, type })
    }

    fieldTypes[name] = type
  }

  checkCondition(checkOptionShape(primaryIndex, [Object]), 'invalidStorageSchema')

  return { primaryIndex, secondaryIndexes, fieldTypes }
}

const checkAndGetFieldType = (metaInfo, fieldName) => {
  if (!/^\w+?(?:\.\w+?)*?$/.test(fieldName)) return null

  const [baseName, ...nestedName] = fieldName.split('.')
  if (!metaInfo.fieldTypes[baseName]) return null

  const fieldType = metaInfo.fieldTypes[baseName]
  if (nestedName.length > 0 && fieldType !== 'json') {
    return null
  }

  return fieldType
}

const checkFieldList = (metaInfo, fieldList) => {
  checkCondition(Array.isArray(fieldList), 'fieldListNotArray')
  for (let fieldName of fieldList) {
    checkCondition(checkAndGetFieldType(metaInfo, fieldName), 'invalidProjectionKey', fieldName)
  }
}

const boxingTypesMap = new Map([
  [Number, 'number'],
  [String, 'string'],
  [Date, 'datetime'],
  [Array, 'json'],
  [Object, 'json']
])

const isFieldValueCorrect = (metaInfo, fieldName, fieldValue, isNullable = true) => {
  try {
    const fieldType = checkAndGetFieldType(metaInfo, fieldName)
    if (!fieldType) return false

    if (fieldValue != null) {
      return boxingTypesMap.get(fieldValue.constructor) === fieldType
    }

    return isNullable
  } catch (err) {
    return false
  }
}

const checkDocumentShape = (metaInfo, document, strict = false) => {
  checkCondition(checkOptionShape(document, [Object]), 'invalidDocumentShape', document)
  const documentKeys = Object.keys(document)

  checkCondition(
    !strict || Object.keys(metaInfo.fieldTypes).length === documentKeys.length,
    'invalidDocumentShape',
    document
  )

  checkFieldList(metaInfo, documentKeys)
  const { primaryIndex, secondaryIndexes } = metaInfo

  for (let fieldName of documentKeys) {
    if (document[fieldName] === null && metaInfo.fieldTypes[fieldName] === 'json') continue

    const isNullable = !!(
      primaryIndex.name === fieldName || secondaryIndexes.find({ name } === fieldName)
    )

    checkCondition(
      isFieldValueCorrect(metaInfo, fieldName, documentKeys[fieldName], isNullable),
      'invalidDocumentShape',
      document
    )
  }
}

const checkSearchExpression = (metaInfo, searchExpression) => {
  checkCondition(
    checkOptionShape(searchExpression, [Object]),
    'invalidSearchExpression',
    searchExpression
  )

  const rootOperators = ['$not', '$and', '$or']
  const allowedOperators = [...rootOperators, '$eq', '$exists']

  const operators = Object.keys(searchExpression).filter(key => key.indexOf('$') > -1)
  if (operators.length === 0) {
    checkDocumentShape(metaInfo, searchExpression)
    return
  }

  checkCondition(
    operators.length === Object.keys(searchExpression).length,
    'invalidSearchExpression',
    searchExpression
  )

  for (let operator of operators) {
    checkCondition(rootOperators.includes(operator), 'invalidSearchExpression', searchExpression)

    const operatorValue = searchExpression[operator]
    checkCondition(
      checkOptionShape(operatorValue, [Array, Object]),
      'invalidSearchExpression',
      searchExpression
    )

    for (let key of Array.isArray(operatorValue)
      ? operatorValue.map((_, idx) => idx)
      : Object.keys(operatorValue)) {
      if (key.indexOf('$') > -1) {
        checkCondition(
          allowedOperators.indexOf(key) > -1,
          'invalidSearchExpression',
          searchExpression
        )
        continue
      }

      checkCondition(
        isFieldValueCorrect(metaInfo, key, operatorValue[key]),
        'invalidSearchExpression',
        searchExpression
      )
    }
  }
}

const checkUpdateExpression = (metaInfo, updateExpression) => {
  checkCondition(
    checkOptionShape(updateExpression, [Object]),
    'invalidUpdateExpression',
    updateExpression
  )

  const operators = Object.keys(updateExpression).filter(key => key.indexOf('$') > -1)
  if (operators.length === 0) {
    checkDocumentShape(metaInfo, updateExpression)
    return
  }

  checkCondition(
    operators.length === Object.keys(updateExpression).length,
    'invalidUpdateExpression',
    updateExpression
  )

  const allowedOperators = ['$set', '$unset', '$inc']

  for (let operator of operators) {
    checkCondition(allowedOperators.includes(operator), 'invalidUpdateExpression', updateExpression)

    const affectedFields = updateExpression[operator]
    checkCondition(
      checkOptionShape(affectedFields, [Object]),
      'invalidUpdateExpression',
      updateExpression
    )

    for (let fieldName of affectedFields) {
      const fieldType = checkAndGetFieldType(metaInfo, fieldName)
      if (operator === '$unset') continue

      checkCondition(
        fieldType === 'json' ||
          (fieldType === 'number' && operator === '$inc') ||
          operator === '$set',
        'invalidUpdateExpression',
        updateExpression
      )

      const updateValueType = boxingTypesMap.get(
        (affectedFields[fieldName] != null ? affectedFields[fieldName] : Object.create(null))
          .constructor
      )

      checkCondition(
        (operator === '$set' && updateValueType !== fieldType) ||
          (operator === '$inc' && updateValueType !== 'number'),
        'invalidUpdateExpression',
        updateExpression
      )
    }
  }
}

const checkStorageExists = async (metaApi, storageName) => {
  checkCondition(await metaApi.storageExists(storageName), 'storageNotExist', storageName)
}

const createStorage = async ({ metaApi, storeApi }, storageName, inputStorageSchema) => {
  checkCondition(!await metaApi.storageExists(storageName), 'storageExists', storageName)
  const storageSchema = checkAndGetStorageMetaSchema(inputStorageSchema)
  await storeApi.createStorage(storageName, storageSchema)
  await metaApi.addStorage(storageName, storageSchema)
}

const dropStorage = async ({ metaApi, storeApi }, storageName) => {
  await checkStorageExists(metaApi, storageName)
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
  await checkStorageExists(metaApi, storageName)

  const metaInfo = await metaApi.getStorageInfo(storageName)
  checkFieldList(metaInfo, resultFieldsList)
  checkFieldList(metaInfo, sortFieldsList)
  checkSearchExpression(metaInfo, searchExpression)

  checkCondition(
    Number.isInteger(skip) && (Number.isInteger(limit) || limit === Infinity),
    'invalidPagination',
    skip,
    limit
  )

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
  await checkStorageExists(metaApi, storageName)

  const metaInfo = await metaApi.getStorageInfo(storageName)
  checkDocumentShape(metaInfo, document, true)

  await storeApi.insert(storageName, document)
}

const update = async ({ metaApi, storeApi }, storageName, searchExpression, updateExpression) => {
  await checkStorageExists(metaApi, storageName)

  const metaInfo = await metaApi.getStorageInfo(storageName)
  checkSearchExpression(metaInfo, searchExpression)
  checkUpdateExpression(metaInfo, updateExpression)

  await storeApi.update(storageName, searchExpression, updateExpression)
}

const del = async ({ metaApi, storeApi }, storageName, searchExpression) => {
  await checkStorageExists(metaApi, storageName)

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
