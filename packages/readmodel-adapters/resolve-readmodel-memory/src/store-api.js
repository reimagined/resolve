import 'regenerator-runtime/runtime'

const defineStorage = async (
  { createStorage, storage },
  storageName,
  storageSchema
) => {
  storage[storageName] = createStorage()

  await new Promise((resolve, reject) =>
    storage[storageName].ensureIndex(
      { fieldName: storageSchema.primaryIndex.name },
      err => (!err ? resolve() : reject(err))
    )
  )
  for (let { name } of storageSchema.secondaryIndexes) {
    await new Promise((resolve, reject) =>
      storage[storageName].ensureIndex(
        { fieldName: name },
        err => (!err ? resolve() : reject(err))
      )
    )
  }
}

const find = async (
  { storage },
  storageName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {
  let findCursor = await storage[storageName].find(searchExpression)

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

const insert = async ({ storage }, storageName, document) => {
  await new Promise((resolve, reject) =>
    storage[storageName].insert(
      document,
      err => (!err ? resolve() : reject(err))
    )
  )
}

const update = async (
  { storage },
  storageName,
  searchExpression,
  updateExpression
) => {
  await new Promise((resolve, reject) =>
    storage[storageName].update(
      searchExpression,
      updateExpression,
      err => (!err ? resolve() : reject(err))
    )
  )
}

const del = async ({ storage }, storageName, searchExpression) => {
  await new Promise((resolve, reject) =>
    storage[storageName].remove(
      searchExpression,
      err => (!err ? resolve() : reject(err))
    )
  )
}

export default {
  defineStorage,
  find,
  insert,
  update,
  del
}
