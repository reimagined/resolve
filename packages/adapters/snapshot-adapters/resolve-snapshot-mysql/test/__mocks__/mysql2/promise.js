const connection = {
  execute: jest.fn(),
  end: jest.fn()
}

const MySQL = {
  createConnection: jest.fn().mockReturnValue(connection)
}

export default MySQL
