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

const checkAndGetTableMetaSchema = tableSchema => {
  checkCondition(Array.isArray(tableSchema), 'invalidTableSchema')

  const validTypes = ['number', 'string', 'json']
  const indexRoles = ['primary', 'secondary']
  let primaryIndex = null
  const secondaryIndexes = []
  const fieldTypes = {}

  for (let rowDescription of tableSchema) {
    checkCondition(
      checkOptionShape(rowDescription, [Object]),
      'invalidTableSchema'
    )
    const { name, type, index } = rowDescription
    checkCondition(/^\w+?$/.test(name), 'invalidTableSchema')
    checkCondition(
      validTypes.indexOf(type) > -1 &&
        (!index || indexRoles.indexOf(index) > -1),
      'invalidTableSchema'
    )

    if (index === 'primary') {
      checkCondition(
        type === 'number' || type === 'string',
        'invalidTableSchema'
      )
      primaryIndex = { name, type }
    } else if (index === 'secondary') {
      checkCondition(
        type === 'number' || type === 'string',
        'invalidTableSchema'
      )
      secondaryIndexes.push({ name, type })
    }

    fieldTypes[name] = type
  }

  checkCondition(checkOptionShape(primaryIndex, [Object]), 'invalidTableSchema')

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
    'invalidFieldList'
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
    if (fieldType === 'json') return true
    if (fieldValue == null) return isNullable

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
    const isNullable = !(
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

const checkSearchExpression = (metaInfo, searchExpression) => {
  checkCondition(
    checkOptionShape(searchExpression, [Object]),
    'invalidSearchExpression',
    searchExpression
  )

  const allowedComparationOperators = [
    '$lt',
    '$lte',
    '$gt',
    '$gte',
    '$eq',
    '$ne'
  ]
  const allowedLogicalOperators = ['$and', '$or', '$not']

  const operators = Object.keys(searchExpression).filter(
    key => key.indexOf('$') > -1
  )

  checkCondition(
    operators.length === 0 ||
      operators.length === Object.keys(searchExpression).length,
    'invalidSearchExpression',
    searchExpression
  )

  if (operators.length > 0) {
    for (let operator of operators) {
      checkCondition(
        allowedLogicalOperators.includes(operator),
        'invalidSearchExpression',
        searchExpression
      )

      if (operator === '$not') {
        checkSearchExpression(metaInfo, searchExpression[operator])
        return
      }

      checkCondition(
        Array.isArray(searchExpression[operator]),
        'invalidSearchExpression',
        searchExpression
      )

      for (let nestedExpr of searchExpression[operator]) {
        checkSearchExpression(metaInfo, nestedExpr)
      }
    }

    return
  }

  const documentKeys = Object.keys(searchExpression)
  checkFieldList(metaInfo, documentKeys)
  const { primaryIndex, secondaryIndexes } = metaInfo

  for (let fieldName of documentKeys) {
    const isNullable = !(
      primaryIndex.name === fieldName ||
      secondaryIndexes.find(({ name }) => name === fieldName)
    )

    let fieldValue = searchExpression[fieldName]

    if (searchExpression[fieldName] instanceof Object) {
      const inOperators = Object.keys(searchExpression[fieldName]).filter(
        key => key.indexOf('$') > -1
      )

      checkCondition(
        inOperators.length === 0 || inOperators.length === 1,
        'invalidSearchExpression',
        searchExpression
      )

      if (inOperators.length > 0) {
        checkCondition(
          allowedComparationOperators.indexOf(inOperators[0]) > -1,
          'invalidSearchExpression',
          searchExpression
        )

        fieldValue = searchExpression[fieldName][inOperators[0]]
      }
    }

    checkCondition(
      isFieldValueCorrect(metaInfo, fieldName, fieldValue, isNullable),
      'invalidSearchExpression',
      searchExpression
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
      if (
        operator === '$unset' ||
        (fieldType === 'json' && operator === '$set')
      )
        continue

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

const checkTableExists = async (metaApi, tableName) => {
  checkCondition(
    await metaApi.tableExists(tableName),
    'tableNotExist',
    tableName
  )
}

const defineTable = async (
  { metaApi, storeApi },
  tableName,
  inputTableSchema
) => {
  checkCondition(
    !(await metaApi.tableExists(tableName)),
    'tableExists',
    tableName
  )
  const tableSchema = checkAndGetTableMetaSchema(inputTableSchema)
  await storeApi.defineTable(tableName, tableSchema)
  await metaApi.describeTable(tableName, tableSchema)
}

const find = async (
  { metaApi, storeApi },
  tableName,
  searchExpression,
  resultFieldsList,
  sortFieldsList,
  skip = 0,
  limit = Infinity
) => {
  await checkTableExists(metaApi, tableName)

  const metaInfo = await metaApi.getTableInfo(tableName)
  if (resultFieldsList != null) {
    checkFieldList(metaInfo, resultFieldsList, [0, 1])
  }
  if (sortFieldsList != null) {
    checkFieldList(metaInfo, sortFieldsList, [-1, 1])
  }

  checkSearchExpression(metaInfo, searchExpression)

  checkCondition(
    ((Number.isInteger(limit) && limit > -1) || limit === Infinity) &&
      Number.isInteger(skip) &&
      skip > -1,
    'invalidPagination',
    skip,
    limit
  )

  return await storeApi.find(
    tableName,
    searchExpression,
    resultFieldsList,
    sortFieldsList,
    skip,
    limit
  )
}

const findOne = async (
  { metaApi, storeApi },
  tableName,
  searchExpression,
  resultFieldsList
) => {
  await checkTableExists(metaApi, tableName)

  const metaInfo = await metaApi.getTableInfo(tableName)
  if (resultFieldsList != null) {
    checkFieldList(metaInfo, resultFieldsList, [0, 1])
  }

  checkSearchExpression(metaInfo, searchExpression)

  return await storeApi.findOne(tableName, searchExpression, resultFieldsList)
}

const count = async ({ metaApi, storeApi }, tableName, searchExpression) => {
  await checkTableExists(metaApi, tableName)

  const metaInfo = await metaApi.getTableInfo(tableName)
  checkSearchExpression(metaInfo, searchExpression)

  return await storeApi.count(tableName, searchExpression)
}

const insert = async ({ metaApi, storeApi }, tableName, document) => {
  await checkTableExists(metaApi, tableName)

  const metaInfo = await metaApi.getTableInfo(tableName)
  checkDocumentShape(metaInfo, document, true)

  await storeApi.insert(tableName, document)
}

const update = async (
  { metaApi, storeApi },
  tableName,
  searchExpression,
  updateExpression
) => {
  await checkTableExists(metaApi, tableName)

  const metaInfo = await metaApi.getTableInfo(tableName)
  checkSearchExpression(metaInfo, searchExpression)
  checkUpdateExpression(metaInfo, updateExpression)

  await storeApi.update(tableName, searchExpression, updateExpression)
}

const del = async ({ metaApi, storeApi }, tableName, searchExpression) => {
  await checkTableExists(metaApi, tableName)

  const metaInfo = await metaApi.getTableInfo(tableName)
  checkSearchExpression(metaInfo, searchExpression)

  await storeApi.del(tableName, searchExpression)
}

const checkStoreApi = pool => {
  return Object.freeze({
    defineTable: defineTable.bind(null, pool),
    find: find.bind(null, pool),
    findOne: findOne.bind(null, pool),
    count: count.bind(null, pool),
    insert: insert.bind(null, pool),
    update: update.bind(null, pool),
    delete: del.bind(null, pool)
  })
}

export default checkStoreApi
