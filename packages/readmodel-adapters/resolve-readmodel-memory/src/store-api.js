const defineTable = async ({ createTable, storage }, tableName, { indexes }) => {
  storage[tableName] = createTable()

  for (let fieldName of indexes) {
    await new Promise((resolve, reject) =>
      storage[tableName].ensureIndex({ fieldName }, err => (!err ? resolve() : reject(err)))
    )
  }
}

const find = async ({ storage }, tableName, searchExpression, fieldList, sort, skip, limit) => {
  let findCursor = await storage[tableName].find(searchExpression)

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
  let findCursor = await storage[tableName].findOne(searchExpression)

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
      searchExpression,
      (err, count) => (!err ? resolve(count) : reject(err))
    )
  )
}

const insert = async ({ storage }, tableName, document) => {
  await new Promise((resolve, reject) =>
    storage[tableName].insert(document, err => (!err ? resolve() : reject(err)))
  )
}

const update = async ({ storage }, tableName, searchExpression, updateExpression) => {
  await new Promise((resolve, reject) =>
    storage[tableName].update(
      searchExpression,
      updateExpression,
      err => (!err ? resolve() : reject(err))
    )
  )
}

const del = async ({ storage }, tableName, searchExpression) => {
  await new Promise((resolve, reject) =>
    storage[tableName].remove(searchExpression, err => (!err ? resolve() : reject(err)))
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
