import messages from './messages'

const COLUMN_NAME_REGEXP = /^(?:\w|\d|-)+?$/
const FIELD_NAME_REGEXP = /^(?:\w|\d|-)+?(?:\.(?:\w|\d|-)+?)*?$/

const checkCondition = (condition, messageGenerator, ...args) => {
  if (!condition) {
    throw new Error(
      typeof messageGenerator === 'function'
        ? messageGenerator(...args)
        : messageGenerator
    )
  }
}

const checkOptionShape = (option, types, nullable = false) =>
  (nullable && option === null) ||
  !(
    option == null ||
    !types.reduce((acc, type) => acc || option.constructor === type, false)
  )

const checkAndGetTableMetaSchema = (tableName, tableSchema) => {
  checkCondition(
    checkOptionShape(tableSchema, [Object]) &&
      Array.isArray(tableSchema.fields) &&
      checkOptionShape(tableSchema.indexes, [Object]),
    messages.invalidTableSchema,
    tableName,
    messages.tableDescriptorNotObject,
    tableSchema
  )

  const { fields, indexes } = tableSchema
  const schema = {}

  for (let columnName of fields) {
    checkCondition(
      COLUMN_NAME_REGEXP.test(columnName),
      messages.invalidTableSchema,
      tableName,
      messages.columnWrongName,
      columnName
    )

    schema[columnName] = 'regular'
  }

  checkCondition(
    Object.keys(indexes).length > 0,
    messages.invalidTableSchema,
    tableName,
    messages.tableWithoutPrimaryIndex,
    indexes
  )

  for (let [idx, indexName] of Object.keys(indexes).entries()) {
    const indexType = indexes[indexName]
    checkCondition(
      COLUMN_NAME_REGEXP.test(indexName) &&
        (indexType === 'number' || indexType === 'string'),
      messages.invalidTableSchema,
      tableName,
      messages.columnWrongIndex,
      indexName
    )

    schema[indexName] = `${idx === 0 ? 'primary' : 'secondary'}-${indexType}`
  }

  return schema
}

const checkAndGetColumnStatus = (metaInfo, fieldName, allowNested) => {
  if (!FIELD_NAME_REGEXP.test(fieldName)) return null

  const [baseName, ...nestedName] = fieldName.split('.')
  if (
    !metaInfo[baseName] ||
    (nestedName.length > 0 &&
      (metaInfo[baseName] !== 'regular' || !allowNested))
  ) {
    return null
  }

  return metaInfo[baseName]
}

const checkFieldList = (
  metaInfo,
  fieldList,
  allowNested,
  validProjectionValues = []
) => {
  if (!checkOptionShape(fieldList, [Object, Array])) {
    return '*'
  }

  if (Array.isArray(fieldList)) {
    for (let fieldName of fieldList) {
      if (!checkAndGetColumnStatus(metaInfo, fieldName, allowNested)) {
        return fieldName
      }
    }
    return
  }

  for (let fieldName of Object.keys(fieldList)) {
    if (
      !checkAndGetColumnStatus(metaInfo, fieldName, allowNested) ||
      !(validProjectionValues.indexOf(fieldList[fieldName]) > -1)
    ) {
      return fieldName
    }
  }

  return null
}

// BSON Types in MongoDB: https://docs.mongodb.com/manual/reference/bson-types/
// JSON types in MySQL: https://dev.mysql.com/doc/refman/5.7/en/json-attribute-functions.html#function_json-type
// Compromise allowed ES6 types based on above lists intersection:
const allowedJsonTypes = [String, Number, Array, Boolean, Object]

const isFieldValueCorrect = (metaInfo, fieldName, fieldValue, allowNested) => {
  try {
    const columnType = checkAndGetColumnStatus(metaInfo, fieldName, allowNested)

    switch (columnType) {
      case 'primary-string':
        return checkOptionShape(fieldValue, [String])
      case 'primary-number':
        return checkOptionShape(fieldValue, [Number])
      case 'secondary-string':
        return checkOptionShape(fieldValue, [String], true)
      case 'secondary-number':
        return checkOptionShape(fieldValue, [Number], true)
      case 'regular':
        return checkOptionShape(fieldValue, allowedJsonTypes, true)
      default:
        return false
    }
  } catch (err) {
    return false
  }
}

const checkInsertedDocumentShape = (tableName, metaInfo, document) => {
  const documentKeys = document instanceof Object ? Object.keys(document) : []

  checkCondition(
    checkOptionShape(document, [Object]) &&
      Object.keys(metaInfo).length === documentKeys.length,
    messages.invalidFieldList,
    'insert',
    tableName,
    document,
    messages.fieldListNotObject
  )

  const checkFieldResult = checkFieldList(metaInfo, documentKeys, false)
  checkCondition(
    checkFieldResult == null,
    messages.invalidFieldList,
    'insert',
    tableName,
    document,
    messages.nonExistingField,
    checkFieldResult
  )

  for (let fieldName of documentKeys) {
    checkCondition(
      isFieldValueCorrect(metaInfo, fieldName, document[fieldName], false),
      messages.invalidFieldList,
      'insert',
      tableName,
      document,
      messages.columnTypeMismatch,
      fieldName
    )
  }
}

const checkSearchExpression = (
  tableName,
  operation,
  metaInfo,
  searchExpression
) => {
  checkCondition(
    checkOptionShape(searchExpression, [Object]),
    messages.invalidSearchExpression,
    operation,
    tableName,
    searchExpression,
    messages.searchExpressionNotObject
  )

  const allowedComparisonOperators = [
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
    messages.invalidSearchExpression,
    operation,
    tableName,
    searchExpression,
    messages.mixedSearchOperatorsAndValues
  )

  if (operators.length > 0) {
    for (let operator of operators) {
      checkCondition(
        allowedLogicalOperators.includes(operator),
        messages.invalidSearchExpression,
        operation,
        tableName,
        searchExpression,
        messages.illegalLogicalOperator,
        operator
      )

      if (operator === '$not') {
        checkSearchExpression(
          tableName,
          operation,
          metaInfo,
          searchExpression[operator]
        )
        return
      }

      checkCondition(
        Array.isArray(searchExpression[operator]),
        messages.invalidSearchExpression,
        operation,
        tableName,
        searchExpression,
        messages.illegalOperatorAndOrArgument,
        searchExpression[operator]
      )

      for (let nestedExpr of searchExpression[operator]) {
        checkSearchExpression(tableName, operation, metaInfo, nestedExpr)
      }
    }

    return
  }

  const documentKeys = Object.keys(searchExpression)

  const checkFieldResult = checkFieldList(metaInfo, documentKeys, true)
  checkCondition(
    checkFieldResult == null,
    messages.invalidFieldList,
    operation,
    tableName,
    searchExpression,
    messages.nonExistingField,
    checkFieldResult
  )

  for (let fieldName of documentKeys) {
    let fieldValue = searchExpression[fieldName]

    if (searchExpression[fieldName] instanceof Object) {
      const inOperators = Object.keys(searchExpression[fieldName]).filter(
        key => key.indexOf('$') > -1
      )

      checkCondition(
        inOperators.length === 0 || inOperators.length === 1,
        messages.invalidSearchExpression,
        operation,
        tableName,
        searchExpression,
        messages.searchValueScalarOrCompareOperator,
        searchExpression[fieldName]
      )

      if (inOperators.length > 0) {
        checkCondition(
          allowedComparisonOperators.indexOf(inOperators[0]) > -1,
          messages.invalidSearchExpression,
          operation,
          tableName,
          searchExpression,
          messages.illegalCompareOperator,
          searchExpression[fieldName]
        )

        fieldValue = searchExpression[fieldName][inOperators[0]]
      }
    }

    checkCondition(
      isFieldValueCorrect(metaInfo, fieldName, fieldValue, true),
      messages.invalidSearchExpression,
      operation,
      tableName,
      searchExpression,
      messages.incompatibleSearchField,
      { [fieldName]: fieldValue }
    )
  }
}

const checkUpdateExpression = (
  tableName,
  metaInfo,
  updateExpression,
  isUpsert
) => {
  const operators =
    updateExpression instanceof Object
      ? Object.keys(updateExpression).filter(key => key.indexOf('$') > -1)
      : []

  checkCondition(
    checkOptionShape(updateExpression, [Object]) &&
      (operators.length > 0 &&
        operators.length === Object.keys(updateExpression).length),
    messages.invalidUpdateExpression,
    tableName,
    updateExpression,
    messages.updateExpressionNotValidObject
  )

  const allowedOperators = isUpsert ? ['$set'] : ['$set', '$unset', '$inc']

  for (let operator of operators) {
    checkCondition(
      allowedOperators.includes(operator),
      messages.invalidUpdateExpression,
      tableName,
      updateExpression,
      messages.illegalUpdateOperator,
      operator
    )

    const affectedFields = updateExpression[operator]
    checkCondition(
      checkOptionShape(affectedFields, [Object]),
      messages.invalidUpdateExpression,
      tableName,
      updateExpression,
      messages.updateOperatorNotObject,
      affectedFields
    )

    for (let fieldName of Object.keys(affectedFields)) {
      checkCondition(
        operator !== '$unset'
          ? isFieldValueCorrect(
              metaInfo,
              fieldName,
              affectedFields[fieldName],
              true
            ) &&
            (operator === '$set' ||
              (operator === '$inc' &&
                affectedFields[fieldName] != null &&
                affectedFields[fieldName].constructor === Number))
          : checkAndGetColumnStatus(metaInfo, fieldName, true),
        messages.invalidUpdateExpression,
        tableName,
        updateExpression,
        messages.incompatibleUpdateValue,
        fieldName
      )
    }
  }
}

const checkTableExists = async (metaApi, tableName) => {
  checkCondition(
    await metaApi.tableExists(tableName),
    messages.tableNotExist,
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
    messages.tableExists,
    tableName
  )
  const tableSchema = checkAndGetTableMetaSchema(tableName, inputTableSchema)
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
    const checkFieldResult = checkFieldList(metaInfo, resultFieldsList, true, [
      0,
      1
    ])

    checkCondition(
      checkFieldResult == null,
      messages.invalidFieldList,
      'find',
      tableName,
      resultFieldsList,
      ...(checkFieldResult !== '*'
        ? [messages.illegalProjectionColumn, checkFieldResult]
        : [messages.projectionNotObject])
    )
  }

  if (sortFieldsList != null) {
    const checkFieldResult = checkFieldList(metaInfo, sortFieldsList, true, [
      -1,
      1
    ])

    checkCondition(
      checkFieldResult == null,
      messages.invalidFieldList,
      'find',
      tableName,
      resultFieldsList,
      ...(checkFieldResult !== '*'
        ? [messages.illegalSortColumn, checkFieldResult]
        : [messages.sortNotObject])
    )
  }

  checkSearchExpression(tableName, 'find', metaInfo, searchExpression)

  checkCondition(
    ((Number.isInteger(limit) && limit > -1) || limit === Infinity) &&
      Number.isInteger(skip) &&
      skip > -1,
    messages.invalidPagination,
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
    const checkFieldResult = checkFieldList(metaInfo, resultFieldsList, true, [
      0,
      1
    ])

    checkCondition(
      checkFieldResult == null,
      messages.invalidFieldList,
      'findOne',
      tableName,
      resultFieldsList,
      ...(checkFieldResult !== '*'
        ? [messages.illegalProjectionColumn, checkFieldResult]
        : [messages.projectionNotObject])
    )
  }

  checkSearchExpression(tableName, 'findOne', metaInfo, searchExpression)

  return await storeApi.findOne(tableName, searchExpression, resultFieldsList)
}

const count = async ({ metaApi, storeApi }, tableName, searchExpression) => {
  await checkTableExists(metaApi, tableName)

  const metaInfo = await metaApi.getTableInfo(tableName)
  checkSearchExpression(tableName, 'count', metaInfo, searchExpression)

  return await storeApi.count(tableName, searchExpression)
}

const insert = async ({ metaApi, storeApi }, tableName, document) => {
  await checkTableExists(metaApi, tableName)

  const metaInfo = await metaApi.getTableInfo(tableName)
  checkInsertedDocumentShape(tableName, metaInfo, document)

  await storeApi.insert(tableName, document)
}

const update = async (
  { metaApi, storeApi },
  tableName,
  searchExpression,
  updateExpression,
  inputOptions
) => {
  await checkTableExists(metaApi, tableName)

  checkCondition(
    checkOptionShape(inputOptions, [Object], true),
    messages.invalidUpdateExpression,
    inputOptions,
    messages.invalidUpdateOptions
  )

  let options = inputOptions || {}

  checkCondition(
    Object.keys(options).length === 0 ||
      (Object.keys(options).length === 1 &&
        (options.upsert === true || options.upsert === false)),
    messages.invalidUpdateExpression,
    options,
    messages.invalidUpdateOptions
  )

  const isUpsert = options.upsert === true

  const metaInfo = await metaApi.getTableInfo(tableName)
  checkSearchExpression(tableName, 'update', metaInfo, searchExpression)
  checkUpdateExpression(tableName, metaInfo, updateExpression, isUpsert)

  await storeApi.update(tableName, searchExpression, updateExpression, options)
}

const del = async ({ metaApi, storeApi }, tableName, searchExpression) => {
  await checkTableExists(metaApi, tableName)

  const metaInfo = await metaApi.getTableInfo(tableName)
  checkSearchExpression(tableName, 'delete', metaInfo, searchExpression)

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
