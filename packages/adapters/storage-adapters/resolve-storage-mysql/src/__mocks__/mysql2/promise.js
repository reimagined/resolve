const result = []
const connection = {
  execute: jest.fn(),
  query: jest.fn(),
  end: jest.fn()
}

const MySQL = {
  createConnection: async (...args) => {
    result.push('createConnection', args)

    return connection
  }
}

export default MySQL

export { connection, result }
