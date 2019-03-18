import { MongoClient, ObjectID } from 'mongodb'
import createAdapter from 'resolve-readmodel-base'

const ROOT_ID = ObjectID.createFromHexString('5265736f6c7665526f6f7400')

const dropReadModel = async ({ databasePromise }, readModelName) => {
  const database = await databasePromise

  for (const {
    s: { name }
  } of await database.collections()) {
    const collection = await database.collection(name)
    const root = await collection.findOne({ _id: ROOT_ID })

    if (root != null && root.readModelName === readModelName) {
      await collection.drop()
    }
  }
}

const setupConnection = async pool => {
  pool.databasePromise = new Promise((resolve, reject) => {
    pool.MongoClient.connect(
      pool.url,
      {
        ...pool.connectionOptions,
        useNewUrlParser: true,
        autoReconnect: false
      },
      (error, client) => {
        if (error != null) {
          return reject(error)
        }
        try {
          pool.connection = client
          return resolve(client.db())
        } catch (error) {
          return reject(error)
        }
      }
    )
  })

  try {
    await pool.databasePromise
  } catch (error) {
    if (error.code === 'CONNECTION_LOST') {
      Promise.resolve().then(setupConnection.bind(null, pool))
      return
    }

    pool.lastMongodbError = error
    // eslint-disable-next-line no-console
    console.warn('MongoDB error: ', error)
  }
}

const connect = async (pool, options) => {
  let { url, tablePrefix, ...connectionOptions } = options
  if (
    tablePrefix == null ||
    (tablePrefix != null && tablePrefix.constructor !== String)
  ) {
    tablePrefix = ''
  }
  Object.assign(pool, { MongoClient, connectionOptions, url, tablePrefix })
  await setupConnection(pool)
}

const disconnect = async ({ connection }) => {
  await connection.close()
}

const drop = async ({ databasePromise }) => {
  const database = await databasePromise

  for (const {
    s: { name }
  } of await database.collections()) {
    const collection = await database.collection(name)
    const root = await collection.findOne({ _id: ROOT_ID })

    if (root != null) {
      await collection.drop()
    }
  }
}

const getCollection = async (
  { databasePromise, tablePrefix },
  readModelName,
  tableName,
  forceCreate = false
) => {
  const database = await databasePromise
  const collection = forceCreate
    ? await database.createCollection(`${tablePrefix}${tableName}`)
    : await database.collection(`${tablePrefix}${tableName}`)

  return collection
}

const defineTable = async (
  pool,
  readModelName,
  tableName,
  tableDescription
) => {
  const collection = await getCollection(pool, readModelName, tableName, true)
  const root = { _id: ROOT_ID, readModelName }
  if (
    tableDescription == null ||
    tableDescription.constructor !== Object ||
    tableDescription.indexes == null ||
    tableDescription.indexes.constructor !== Object ||
    !Array.isArray(tableDescription.fields)
  ) {
    throw new Error(`Wrong table description ${tableDescription}`)
  }

  for (const [idx, indexName] of Object.keys(
    tableDescription.indexes
  ).entries()) {
    const indexArgs = [{ [indexName]: 1 }]
    if (idx === 0) {
      indexArgs.push({ unique: true })
    }
    await collection.createIndex(...indexArgs)

    root[indexName] = ROOT_ID
  }

  await collection.insert(root)
}

// BSON Types in mongodb: https://docs.mongodb.com/manual/reference/bson-types/
// Type schema conversion algorithm in mongodb native driver: https://bit.ly/2weXEnh
// Only allowed in *Resolve Read-model Query & Projection API* data types are present
const bsonTypesMap = new Map([
  [String, 'string'],
  [Number, ['double', 'int', 'long', 'decimal']],
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

  const result = operatorKeys.reduce((acc, key) => {
    if (Array.isArray(expression[key])) {
      acc[key] = expression[key].map(wrapSearchExpression)
    } else {
      acc[key] = wrapSearchExpression(expression[key])
    }

    return acc
  }, {})

  return { $and: [{ _id: { $ne: ROOT_ID } }, result] }
}

const find = async (
  pool,
  readModelName,
  tableName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {
  const collection = await getCollection(pool, readModelName, tableName)

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
  pool,
  readModelName,
  tableName,
  searchExpression,
  fieldList
) => {
  const collection = await getCollection(pool, readModelName, tableName)

  return await collection.findOne(wrapSearchExpression(searchExpression), {
    projection: fieldList ? { _id: 0, ...fieldList } : { _id: 0 }
  })
}

const count = async (pool, readModelName, tableName, searchExpression) => {
  const collection = await getCollection(pool, readModelName, tableName)

  return await collection.countDocuments(wrapSearchExpression(searchExpression))
}

const insert = async (pool, readModelName, tableName, document) => {
  const collection = await getCollection(pool, readModelName, tableName)

  return await collection.insertOne(document)
}

const update = async (
  pool,
  readModelName,
  tableName,
  searchExpression,
  updateExpression,
  options
) => {
  const collection = await getCollection(pool, readModelName, tableName)

  return await collection.updateMany(
    wrapSearchExpression(searchExpression),
    updateExpression,
    { upsert: options != null ? !!options.upsert : false }
  )
}

const del = async (pool, readModelName, tableName, searchExpression) => {
  const collection = await getCollection(pool, readModelName, tableName)

  return await collection.deleteMany(wrapSearchExpression(searchExpression))
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
