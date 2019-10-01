const result = []
const database = {
  createCollection: jest.fn(),
  dropCollection: jest.fn(),
  collection: jest.fn()
}

const MongoClient = {
  connect: async (...args) => {
    result.push('connect', args)

    const client = {
      db: async (...args) => {
        result.push('db', args)

        return database
      },
      close: async (...args) => {
        result.push('close', args)
      }
    }

    return client
  }
}

export { MongoClient, database, result }
