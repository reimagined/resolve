const map = new Map()
const collection = {
  createIndex: () => {},
  findOne: ({ snapshotKey }) => {
    return {
      content: map.get(snapshotKey) === undefined ? null : map.get(snapshotKey)
    }
  },
  insertOne: ({ snapshotKey, content }) => {
    map.set(snapshotKey, content)
  },
  findOneAndDelete: ({ snapshotKey }) => {
    map.delete(snapshotKey)
  }
}

const database = {
  collection: jest.fn().mockReturnValue(collection)
}

const client = {
  db: jest.fn().mockReturnValue(database),
  close: jest.fn()
}

const MongoClient = {
  connect: jest.fn().mockReturnValue(client)
}

export { MongoClient }
