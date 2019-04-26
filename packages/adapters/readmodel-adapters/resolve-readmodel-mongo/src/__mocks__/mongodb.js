export const result = []

const collection = {
  createIndex: (...args) => {
    result.push(['createIndex', ...args])
  },
  insert: (...args) => {
    result.push(['insert', ...args])
  },
  insertOne: (...args) => {
    result.push(['insertOne', ...args])
  },
  updateMany: (...args) => {
    result.push(['updateMany', ...args])
  },
  deleteMany: (...args) => {
    result.push(['deleteMany', ...args])
  },
  countDocuments: (...args) => {
    result.push(['countDocuments', ...args])
  },
  findOne: (...args) => {
    result.push(['findOne', ...args])
    return {}
  },
  find: (...args) => {
    result.push(['find', ...args])
    return {
      toArray: () => []
    }
  }
}

const db = () => ({
  createCollection: (...args) => {
    result.push(['createCollection', ...args])
    return collection
  },
  collection: (...args) => {
    result.push(['collection', ...args])
    return collection
  },
  collections: (...args) => {
    result.push(['collections', ...args])
    return []
  }
})

const close = (...args) => {
  result.push(['disconnect', ...args])
  return []
}

const connect = (url, options, callback) => {
  result.push(['connect', url, options])
  const error = null
  callback(error, { db, close })
}

export const MongoClient = { connect }

export const ObjectID = id => String(id)

ObjectID.createFromHexString = ObjectID
