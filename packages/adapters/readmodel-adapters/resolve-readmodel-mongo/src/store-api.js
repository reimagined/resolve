const defineTable = async ({ connection }, tableName, tableDescription) => {
  const db = await connection.db()
  const collection = await db.collection(tableName)
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
// Only allowed in *Resolve Read-model Query & Projection API* data types are present
const bsonTypesMap = new Map([
  [String, 'string'],
  [Number, 'double'],
  [Array, 'array'],
  [Boolean, 'bool'],
  [Object, 'object'],
  [null, 'null']
])

const transformCompareOperator = operation => {
  const key = Object.keys(operation)[0]
  const value = operation[key]
  const type = bsonTypesMap.get(value != null ? value.constructor : null)

  if (type == null) {
    throw new Error(`Invalid BSON type provided: ${value}`)
  }

  switch (key) {
    case '$eq':
      return { $eq: value, $type: type }
    case '$ne':
      return { $not: { $eq: value, $type: type } }
    case '$lt':
      return { $lt: value, $type: type }
    case '$lte':
      return { $lte: value, $type: type }
    case '$gt':
      return { $gt: value, $type: type }
    case '$gte':
      return { $gte: value, $type: type }
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
  const db = await connection.db()
  const collection = await db.collection(tableName)
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
  const db = await connection.db()
  const collection = await db.collection(tableName)

  return await collection.findOne(wrapSearchExpression(searchExpression), {
    projection: fieldList ? { _id: 0, ...fieldList } : { _id: 0 }
  })
}

const count = async ({ connection }, tableName, searchExpression) => {
  const db = await connection.db()
  const collection = await db.collection(tableName)
  return await collection.count(wrapSearchExpression(searchExpression))
}

const insert = async ({ connection }, tableName, document) => {
  const db = await connection.db()
  const collection = await db.collection(tableName)
  return await collection.insertOne(document)
}

const update = async (
  { connection },
  tableName,
  searchExpression,
  updateExpression,
  options
) => {
  const db = await connection.db()
  const collection = await db.collection(tableName)
  return await collection.updateMany(
    wrapSearchExpression(searchExpression),
    updateExpression,
    { upsert: !!options.upsert }
  )
}

const del = async ({ connection }, tableName, searchExpression) => {
  const db = await connection.db()
  const collection = await db.collection(tableName)
  return await collection.deleteMany(wrapSearchExpression(searchExpression))
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
