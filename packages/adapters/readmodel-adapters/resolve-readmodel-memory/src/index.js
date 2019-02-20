import NeDB from 'nedb'
import createAdapter from 'resolve-readmodel-base'

const connect = async (pool, options) => {
  Object.assign(pool, {
    createTable: () => new NeDB({ autoload: true }),
    readModels: new Map(),
    options
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

const dropReadModel = async ({ readModels }, readModelName) => {
  readModels.delete(readModelName)
}

const drop = async pool => {
  for (const key of Array.from(pool.readModels.keys())) {
    const readModel = pool.readModels.get(key)
    readModel.content.clear()
  }
}

const disconnect = async () => null

const defineTable = async (
  { getReadModel, createTable },
  readModelName,
  tableName,
  tableDescription
) => {
  const table = createTable()
  getReadModel(readModelName).content.set(tableName, table)
  if (
    tableDescription == null ||
    tableDescription.constructor !== Object ||
    tableDescription.indexes == null ||
    tableDescription.indexes.constructor !== Object ||
    !Array.isArray(tableDescription.fields)
  ) {
    throw new Error(`Wrong table description ${tableDescription}`)
  }

  for (let [idx, indexName] of Object.keys(
    tableDescription.indexes
  ).entries()) {
    const indexDescriptor = { fieldName: indexName }
    if (idx === 0) {
      indexDescriptor.unique = true
    }
    await new Promise((resolve, reject) =>
      table.ensureIndex(indexDescriptor, err =>
        !err ? resolve() : reject(err)
      )
    )
  }
}

// Only allowed in *Resolve Read-model Query & Projection API* data types are present
const jsonTypesMap = new Map([
  [String, 'string'],
  [Number, 'double'],
  [Array, 'array'],
  [Boolean, 'bool'],
  [Object, 'object'],
  [null, 'null']
])

const strictCompareValues = (operator, leftValue, rightValue) => {
  const [leftType, rightType] = [leftValue, rightValue].map(value =>
    jsonTypesMap.get(value != null ? value.constructor : null)
  )

  if (leftType == null || rightType == null) {
    throw new Error(`Invalid JSON type provided: ${leftValue} / ${rightValue}`)
  }

  if (leftType !== rightType) {
    return operator === '$ne'
  }

  // Abstract relational comparison ($lt, $gt, $lte, $gte) performed via followed specification
  // https://www.ecma-international.org/ecma-262/9.0/index.html#sec-abstract-relational-comparison
  switch (operator) {
    case '$eq':
      return JSON.stringify(leftValue) === JSON.stringify(rightValue)
    case '$ne':
      return JSON.stringify(leftValue) !== JSON.stringify(rightValue)
    case '$lt':
      return leftValue < rightValue
    case '$lte':
      return leftValue <= rightValue
    case '$gt':
      return leftValue > rightValue
    case '$gte':
      return leftValue >= rightValue
    default:
      return false
  }
}

const isOperatorValue = value =>
  value != null &&
  Object.keys(value)[0] != null &&
  Object.keys(value)[0][0] === '$'

const processWhereExpression = (document, expression) => {
  const searchKeys = Object.keys(expression)
  const operatorKeys = searchKeys.filter(key => key.indexOf('$') > -1)

  if (operatorKeys.length === 0) {
    return searchKeys.reduce((acc, key) => {
      const operation = !isOperatorValue(expression[key])
        ? { $eq: expression[key] }
        : expression[key]
      const operator = Object.keys(operation)[0]
      const comparedValue = operation[operator]
      const extractedValue = key
        .split(/\./)
        .reduce(
          (acc, val) =>
            acc != null && acc.hasOwnProperty(val) ? acc[val] : null,
          document
        )

      return acc && strictCompareValues(operator, extractedValue, comparedValue)
    }, true)
  }

  return operatorKeys.reduce((acc, key) => {
    switch (key) {
      case '$and':
        return (
          acc &&
          expression[key].reduce(
            (result, innerExpr) =>
              result && processWhereExpression(document, innerExpr),
            true
          )
        )

      case '$or':
        return (
          acc &&
          expression[key].reduce(
            (result, innerExpr) =>
              result || processWhereExpression(document, innerExpr),
            false
          )
        )

      case '$not':
        return !processWhereExpression(document, expression[key])

      default:
        return acc
    }
  }, true)
}

// Extract immediate index fields expression like in NeDB for accelerate searching
const getIndexMatchExpression = expression => {
  const indexExpression = {}
  for (const key of Object.keys(expression)) {
    const keyType = jsonTypesMap.get(
      expression[key] != null ? expression[key].constructor : null
    )

    // Supported in NeDB data types and search operators for indexing - https://git.io/fxCab
    if (
      ['string', 'double', 'bool', 'null'].indexOf(keyType) >= 0 ||
      (keyType === 'object' &&
        ['$lt', '$lte', '$gt', '$gte', '$ne'].some(oper =>
          expression[key].hasOwnProperty(oper)
        ))
    ) {
      indexExpression[key] = expression[key]
    }
    // Emulate missing $eq operator in NeDB - https://git.io/fxCaA
    else if (keyType === 'object' && expression[key].hasOwnProperty('$eq')) {
      indexExpression[key] = expression[key]['$eq']
      continue
    }
  }

  return indexExpression
}

const convertSearchExpression = expression => ({
  ...getIndexMatchExpression(expression),
  $where: function() {
    return processWhereExpression(this, expression)
  }
})

const find = async (
  { getReadModel },
  readModelName,
  tableName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {
  const table = getReadModel(readModelName).content.get(tableName)

  let findCursor = await table.find(convertSearchExpression(searchExpression))

  if (sort) {
    findCursor = findCursor.sort(sort)
  }

  if (fieldList) {
    findCursor = findCursor.projection({ _id: 0, ...fieldList })
  } else {
    findCursor = findCursor.projection({ _id: 0 })
  }

  if (Number.isFinite(skip)) {
    findCursor = findCursor.skip(skip)
  }

  if (Number.isFinite(limit)) {
    findCursor = findCursor.limit(limit)
  }

  return await new Promise((resolve, reject) =>
    findCursor.exec((err, docs) => (!err ? resolve(docs) : reject(err)))
  )
}

const findOne = async (
  { getReadModel },
  readModelName,
  tableName,
  searchExpression,
  fieldList
) => {
  const table = getReadModel(readModelName).content.get(tableName)

  let findCursor = await table.findOne(
    convertSearchExpression(searchExpression)
  )

  if (fieldList) {
    findCursor = findCursor.projection({ _id: 0, ...fieldList })
  } else {
    findCursor = findCursor.projection({ _id: 0 })
  }

  return await new Promise((resolve, reject) =>
    findCursor.exec((err, docs) => (!err ? resolve(docs) : reject(err)))
  )
}

const count = async (
  { getReadModel },
  readModelName,
  tableName,
  searchExpression
) => {
  const table = getReadModel(readModelName).content.get(tableName)

  return await new Promise((resolve, reject) =>
    table.count(convertSearchExpression(searchExpression), (err, count) =>
      !err ? resolve(count) : reject(err)
    )
  )
}

const insert = async ({ getReadModel }, readModelName, tableName, document) => {
  const table = getReadModel(readModelName).content.get(tableName)

  await new Promise((resolve, reject) =>
    table.insert(document, err => (!err ? resolve() : reject(err)))
  )
}

const update = async (
  { getReadModel },
  readModelName,
  tableName,
  searchExpression,
  updateExpression,
  options
) => {
  const table = getReadModel(readModelName).content.get(tableName)

  await new Promise((resolve, reject) =>
    table.update(
      convertSearchExpression(searchExpression),
      updateExpression,
      { multi: true, upsert: options != null ? !!options.upsert : false },
      err => (!err ? resolve() : reject(err))
    )
  )
}

const del = async (
  { getReadModel },
  readModelName,
  tableName,
  searchExpression
) => {
  const table = getReadModel(readModelName).content.get(tableName)

  await new Promise((resolve, reject) =>
    table.remove(convertSearchExpression(searchExpression), err =>
      !err ? resolve() : reject(err)
    )
  )
}

export default createAdapter.bind(null, {
  defineTable,
  find,
  findOne,
  count,
  insert,
  update,
  delete: del,
  connect,
  dropReadModel,
  disconnect,
  drop
})
