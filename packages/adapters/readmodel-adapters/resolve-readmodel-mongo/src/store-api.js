const defineTable = async ({ connection }, tableName, tableDescription) => {
  const collection = await connection.collection(tableName)
  for (let [idx, columnName] of Object.keys(tableDescription).entries()) {
    if (tableDescription[columnName] === 'regular') continue
    const indexArgs = [{ [columnName]: 1 }]
    if (idx === 0) {
      indexArgs.push({ unique: true })
    }
    await collection.createIndex(...indexArgs)
  }
}

// BSON Types in mongodb: https://docs.mongodb.com/manual/reference/bson-types/
// Type schema conversion algorithm in mongodb native driver: https://bit.ly/2weXEnh
const bsonTypesMap = new Map([
  [String, 'string'],
  [Number, 'double'],
  [Array, 'array'],
  [Date, 'date'],
  [Boolean, 'bool'],
  [RegExp, 'regex'],
  [Object, 'object'],
  [null, 'null']
])

const transformCompareOperator = operation => {
  const key = Object.keys(operation)[0]
  const value = operation[key]
  const type = bsonTypesMap.get(value != null ? value.constructor : null)

  if (type == null) {
    throw new Error(`Invalid BSON type provided: ${type}`)
  }

  switch (key) {
    case '$eq':
      return { $eq: value, type }
    case '$ne':
      return { $not: { $eq: value, type } }
    case '$lt':
      return { $lt: value, type }
    case '$lte':
      return { $lte: value, type }
    case '$gt':
      return { $gt: value, type }
    case '$gte':
      return { $gte: value, type }
    default:
      throw new Error('Invalid operator')
  }
}

const isOperatorValue = value =>
  value != null &&
  Object.keys(value)[0] != null &&
  Object.keys(value)[0][0] === '$'

const wrapSearchExpression = expression => {
  const searchKeys = Object.keys(expression)
  const operatorKeys = searchKeys.filter(key => key.indexOf('$') > -1)

  if (operatorKeys.length === 0) {
    return searchKeys.reduce((acc, key) => {
      acc[key] = transformCompareOperator(
        !isOperatorValue(expression[key])
          ? { $eq: expression[key] }
          : expression[key]
      )

      return acc
    }, {})
  }

  return operatorKeys.reduce((acc, key) => {
    if (Array.isArray(expression[key])) {
      acc[key] = expression[key].map(wrapSearchExpression)
    } else {
      acc[key] = wrapSearchExpression(expression[key])
    }

    return acc
  }, {})
}

const find = async (
  { connection },
  tableName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {
  const collection = await connection.collection(tableName)
  const findCursor = await collection.find(
    wrapSearchExpression(searchExpression),
    {
      projection: fieldList ? { _id: 0, ...fieldList } : { _id: 0 },
      ...(Number.isFinite(skip) ? { skip } : {}),
      ...(Number.isFinite(limit) ? { limit } : {}),
      ...(sort ? { sort } : {})
    }
  )

  return await findCursor.toArray()
}

const findOne = async (
  { connection },
  tableName,
  searchExpression,
  fieldList
) => {
  const collection = await connection.collection(tableName)

  return await collection.findOne(wrapSearchExpression(searchExpression), {
    projection: fieldList ? { _id: 0, ...fieldList } : { _id: 0 }
  })
}

const count = async ({ connection }, tableName, searchExpression) => {
  const collection = await connection.collection(tableName)
  return await collection.count(wrapSearchExpression(searchExpression))
}

const insert = async ({ connection }, tableName, document) => {
  const collection = await connection.collection(tableName)
  return await collection.insert(document)
}

const update = async (
  { connection },
  tableName,
  searchExpression,
  updateExpression,
  options
) => {
  const collection = await connection.collection(tableName)
  return await collection.update(
    wrapSearchExpression(searchExpression),
    updateExpression,
    {
      multi: true,
      upsert: !!options.upsert
    }
  )
}

const del = async ({ connection }, tableName, searchExpression) => {
  const collection = await connection.collection(tableName)
  return await collection.remove(wrapSearchExpression(searchExpression), {
    multi: true
  })
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
