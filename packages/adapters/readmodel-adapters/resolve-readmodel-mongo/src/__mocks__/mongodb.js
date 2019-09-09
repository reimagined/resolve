const documents = new Map()
let documentIndex = 1

export const result = []

export const ObjectID = id => (id != null ? String(id) : `id${documentIndex++}`)

const collection = {
  createIndex: (...args) => {
    result.push(['createIndex', ...args])
  },
  insert: (...args) => {
    result.push(['insert', ...args])
  },
  insertOne: (...args) => {
    const document = { ...args[0] }
    if (document._id == null) {
      document._id = ObjectID()
    }
    documents.set(document._id, document)
    result.push(['insertOne', document, ...args.slice(1)])
  },
  updateOne: (...args) => {
    result.push(['updateOne', ...args])
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
    if (args[0] != null && documents.has(args[0]._id)) {
      return documents.get(args[0]._id)
    }
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
  },
  listCollections: (...args) => {
    result.push(['listCollections', ...args])
    return {
      toArray: () => []
    }
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

ObjectID.createFromHexString = ObjectID
