import messages from './messages'

const checkCondition = (condition, type, ...args) => {
  if (!condition) {
    const message = messages.hasOwnProperty(type)
      ? typeof messages[type] === 'function'
        ? messages[type](...args)
        : messages[type]
      : `Unknown internal error ${type}: ${args}`

    throw new Error(message)
  }
}

const checkOptionShape = (option, types) => {
  return !(
    option == null ||
    !types.reduce((acc, type) => acc || option.constructor === type, false)
  )
}

const checkAndGetStorageMetaSchema = storageSchema => {
  checkCondition(Array.isArray(storageSchema), 'invalidStorageSchema')

  const validTypes = ['number', 'string', 'json']
  const indexRoles = ['primary', 'secondary']
  let primaryIndex = null
  const secondaryIndexes = []
  const fieldTypes = {}

  for (let rowDescription of storageSchema) {
    checkCondition(
      checkOptionShape(rowDescription, [Object]),
      'invalidStorageSchema'
    )
    const { name, type, index } = rowDescription
    checkCondition(/^\w+?$/.test(name), 'invalidStorageSchema')
    checkCondition(
      validTypes.indexOf(type) > -1 &&
        (!index || indexRoles.indexOf(index) > -1),
      'invalidStorageSchema'
    )

    if (index === 'primary') {
      checkCondition(
        type === 'number' || type === 'string',
        'invalidStorageSchema'
      )
      primaryIndex = { name, type }
    } else if (index === 'secondary') {
      checkCondition(
        type === 'number' || type === 'string',
        'invalidStorageSchema'
      )
      secondaryIndexes.push({ name, type })
    }

    fieldTypes[name] = type
  }

  checkCondition(
    checkOptionShape(primaryIndex, [Object]),
    'invalidStorageSchema'
  )

  return { primaryIndex, secondaryIndexes, fieldTypes }
}

const checkAndGetFieldType = (metaInfo, fieldName) => {
  if (!/^(?:\w|\d|-)+?(?:\.(?:\w|\d|-)+?)*?$/.test(fieldName)) return null

  const [baseName, ...nestedName] = fieldName.split('.')
  if (!metaInfo.fieldTypes[baseName]) return null

  const fieldType = metaInfo.fieldTypes[baseName]
  if (nestedName.length > 0 && fieldType !== 'json') {
    return null
  }

  return fieldType
}

const checkFieldList = (metaInfo, fieldList, validProjectionValues = []) => {
  checkCondition(
    checkOptionShape(fieldList, [Object, Array]),
    'fieldListNotArray'
  )
  if (Array.isArray(fieldList)) {
    for (let fieldName of fieldList) {
      checkCondition(
        checkAndGetFieldType(metaInfo, fieldName),
        'invalidProjectionKey',
        fieldName
      )
    }
    return
  }

  for (let fieldName of Object.keys(fieldList)) {
    checkCondition(
      checkAndGetFieldType(metaInfo, fieldName),
      'invalidProjectionKey',
      fieldName
    )
    checkCondition(
      validProjectionValues.indexOf(fieldList[fieldName]) > -1,
      'invalidProjectionKey',
      fieldName
    )
  }
}

const isFieldValueCorrect = (
  metaInfo,
  fieldName,
  fieldValue,
  isNullable = true
) => {
  try {
    const fieldType = checkAndGetFieldType(metaInfo, fieldName)
    if (!fieldType) return false
    if (fieldValue == null) return isNullable
    if (fieldType === 'json') return true

    return (
      (fieldType === 'number' && fieldValue.constructor === Number) ||
      (fieldType === 'string' && fieldValue.constructor === String)
    )
  } catch (err) {
    return false
  }
}

const checkDocumentShape = (metaInfo, document, strict = false) => {
  checkCondition(
    checkOptionShape(document, [Object]),
    'invalidDocumentShape',
    document
  )
  const documentKeys = Object.keys(document)

  checkCondition(
    !strict || Object.keys(metaInfo.fieldTypes).length === documentKeys.length,
    'invalidDocumentShape',
    document
  )

  checkFieldList(metaInfo, documentKeys)
  const { primaryIndex, secondaryIndexes } = metaInfo

  for (let fieldName of documentKeys) {
    if (
      document[fieldName] === null &&
      metaInfo.fieldTypes[fieldName] === 'json'
    )
      continue

    const isNullable = !!(
      primaryIndex.name === fieldName ||
      secondaryIndexes.find(({ name }) => name === fieldName)
    )

    checkCondition(
      isFieldValueCorrect(metaInfo, fieldName, document[fieldName], isNullable),
      'invalidDocumentShape',
      document
    )
  }
}

const checkUpdateExpression = (metaInfo, updateExpression) => {
  checkCondition(
    checkOptionShape(updateExpression, [Object]),
    'invalidUpdateExpression',
    updateExpression
  )

  const operators = Object.keys(updateExpression).filter(
    key => key.indexOf('$') > -1
  )

  checkCondition(
    operators.length > 0 &&
      operators.length === Object.keys(updateExpression).length,
    'invalidUpdateExpression',
    updateExpression
  )

  const allowedOperators = ['$set', '$unset', '$inc']

  for (let operator of operators) {
    checkCondition(
      allowedOperators.includes(operator),
      'invalidUpdateExpression',
      updateExpression
    )

    const affectedFields = updateExpression[operator]
    checkCondition(
      checkOptionShape(affectedFields, [Object]),
      'invalidUpdateExpression',
      updateExpression
    )

    for (let fieldName of Object.keys(affectedFields)) {
      const fieldType = checkAndGetFieldType(metaInfo, fieldName)
      if (operator === '$unset' || fieldType === 'json') continue

      const updateValueType =
        affectedFields[fieldName] == null
          ? 'null'
          : affectedFields[fieldName].constructor === Number
            ? 'number'
            : affectedFields[fieldName].constructor === String
              ? 'string'
              : 'null'

      checkCondition(
        (operator === '$set' && updateValueType === fieldType) ||
          (operator === '$inc' && updateValueType === 'number'),
        'invalidUpdateExpression',
        updateExpression
      )
    }
  }
}

const checkStorageExists = async (metaApi, storageName) => {
  checkCondition(
    await metaApi.storageExists(storageName),
    'storageNotExist',
    storageName
  )
}

const defineStorage = async (
  { metaApi, storeApi },
  storageName,
  inputStorageSchema
) => {
  checkCondition(
    !await metaApi.storageExists(storageName),
    'storageExists',
    storageName
  )
  const storageSchema = checkAndGetStorageMetaSchema(inputStorageSchema)
  await storeApi.defineStorage(storageName, storageSchema)
  await metaApi.describeStorage(storageName, storageSchema)
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
  if (resultFieldsList != null) {
    checkFieldList(metaInfo, resultFieldsList, [0, 1])
  }
  if (sortFieldsList != null) {
    checkFieldList(metaInfo, sortFieldsList, [-1, 1])
  }

  checkDocumentShape(metaInfo, searchExpression)

  checkCondition(
    ((Number.isInteger(limit) && limit > -1) || limit === Infinity) &&
      Number.isInteger(skip) &&
      skip > -1,
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

const update = async (
  { metaApi, storeApi },
  storageName,
  searchExpression,
  updateExpression
) => {
  await checkStorageExists(metaApi, storageName)

  const metaInfo = await metaApi.getStorageInfo(storageName)
  checkDocumentShape(metaInfo, searchExpression)
  checkUpdateExpression(metaInfo, updateExpression)

  await storeApi.update(storageName, searchExpression, updateExpression)
}

const del = async ({ metaApi, storeApi }, storageName, searchExpression) => {
  await checkStorageExists(metaApi, storageName)

  const metaInfo = await metaApi.getStorageInfo(storageName)
  checkDocumentShape(metaInfo, searchExpression)

  await storeApi.del(storageName, searchExpression)
}

const checkStoreApi = pool => {
  return Object.freeze({
    defineStorage: defineStorage.bind(null, pool),
    find: find.bind(null, pool),
    insert: insert.bind(null, pool),
    update: update.bind(null, pool),
    delete: del.bind(null, pool)
  })
}

export default checkStoreApi
