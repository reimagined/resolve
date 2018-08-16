const defineTable = async (
  { createTable, storage },
  tableName,
  tableDescription
) => {
  storage[tableName] = createTable()

  for (let fieldName of Object.keys(tableDescription)) {
    if (tableDescription[fieldName] === 'regular') continue

    await new Promise((resolve, reject) =>
      storage[tableName].ensureIndex(
        { fieldName },
        err => (!err ? resolve() : reject(err))
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
  const leftType = jsonTypesMap.get(
    leftValue != null ? leftValue.constructor : null
  )
  const rightType = jsonTypesMap.get(
    rightValue != null ? rightValue.constructor : null
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

      return acc && strictCompareValues(operator, comparedValue, extractedValue)
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

const convertSearchExpression = expression => ({
  $and: {
    $and: [expression],
    $where: function() {
      return processWhereExpression(this, expression)
    }
  }
})

const find = async (
  { storage },
  tableName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {
  let findCursor = await storage[tableName].find(
    convertSearchExpression(searchExpression)
  )

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

const findOne = async ({ storage }, tableName, searchExpression, fieldList) => {
  let findCursor = await storage[tableName].findOne(
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

const count = async ({ storage }, tableName, searchExpression) => {
  return await new Promise((resolve, reject) =>
    storage[tableName].count(
      convertSearchExpression(searchExpression),
      (err, count) => (!err ? resolve(count) : reject(err))
    )
  )
}

const insert = async ({ storage }, tableName, document) => {
  await new Promise((resolve, reject) =>
    storage[tableName].insert(document, err => (!err ? resolve() : reject(err)))
  )
}

const update = async (
  { storage },
  tableName,
  searchExpression,
  updateExpression,
  options
) => {
  await new Promise((resolve, reject) =>
    storage[tableName].update(
      convertSearchExpression(searchExpression),
      updateExpression,
      { multi: true, upsert: !!options.upsert },
      err => (!err ? resolve() : reject(err))
    )
  )
}

const del = async ({ storage }, tableName, searchExpression) => {
  await new Promise((resolve, reject) =>
    storage[tableName].remove(
      convertSearchExpression(searchExpression),
      err => (!err ? resolve() : reject(err))
    )
  )
}

export default {
  defineTable,
  find,
  findOne,
  count,
  insert,
  update,
  del
}
