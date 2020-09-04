const result: any = []
const connection = {
  execute: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
}

const promised = (result?: any): Function => jest.fn().mockReturnValue(result)

const MySQL = {
  createConnection: promised(connection),
}

export default MySQL

export { connection, result }
