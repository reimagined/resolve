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

const find = async ({ connection }, tableName, searchExpression, fieldList, sort, skip, limit) => {
  const collection = await connection.collection(tableName)
  const findCursor = await collection.find(searchExpression, {
    projection: fieldList ? { _id: 0, ...fieldList } : { _id: 0 },
    ...(Number.isFinite(skip) ? { skip } : {}),
    ...(Number.isFinite(limit) ? { limit } : {}),
    ...(sort ? { sort } : {})
  })

  return await findCursor.toArray()
}

const findOne = async ({ connection }, tableName, searchExpression, fieldList) => {
  const collection = await connection.collection(tableName)

  return await collection.findOne(searchExpression, {
    projection: fieldList ? { _id: 0, ...fieldList } : { _id: 0 }
  })
}

const count = async ({ connection }, tableName, searchExpression) => {
  const collection = await connection.collection(tableName)
  return await collection.count(searchExpression)
}

const insert = async ({ connection }, tableName, document) => {
  const collection = await connection.collection(tableName)
  return await collection.insert(document)
}

const update = async ({ connection }, tableName, searchExpression, updateExpression, options) => {
  const collection = await connection.collection(tableName)
  return await collection.update(searchExpression, updateExpression, {
    multi: true,
    upsert: !!options.upsert
  })
}

const del = async ({ connection }, tableName, searchExpression) => {
  const collection = await connection.collection(tableName)
  return await collection.remove(searchExpression, { multi: true })
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
