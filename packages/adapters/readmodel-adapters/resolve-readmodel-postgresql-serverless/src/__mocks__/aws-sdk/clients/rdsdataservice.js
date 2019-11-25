const result = []

const executeStatementPromise = jest.fn()

const resetExecuteStatementPromise = () => {
  executeStatementPromise.mockReturnValueOnce(
    Promise.resolve({
      records: [],
      columnMetadata: []
    })
  )
}

resetExecuteStatementPromise()

const beginTransactionPromise = jest
  .fn()
  .mockReturnValue(Promise.resolve({ transactionId: 'transactionId' }))
const commitTransactionPromise = jest
  .fn()
  .mockReturnValue(Promise.resolve({ transactionStatus: 'OK' }))
const rollbackTransactionPromise = jest
  .fn()
  .mockReturnValue(Promise.resolve({ transactionStatus: 'OK' }))

const rdsDataService = {
  beginTransaction: jest.fn().mockImplementation((...args) => {
    result.push('beginTransaction', ...args)
    resetExecuteStatementPromise()
    return { promise: beginTransactionPromise }
  }),
  commitTransaction: jest.fn().mockImplementation((...args) => {
    result.push('commitTransaction', ...args)
    resetExecuteStatementPromise()
    return { promise: commitTransactionPromise }
  }),
  rollbackTransaction: jest.fn().mockImplementation((...args) => {
    result.push('rollbackTransaction', ...args)
    resetExecuteStatementPromise()
    return { promise: rollbackTransactionPromise }
  }),
  executeStatement: jest.fn().mockImplementation((...args) => {
    result.push('executeStatement', ...args)
    resetExecuteStatementPromise()
    return { promise: executeStatementPromise }
  })
}

const RDSDataService = function() {
  return rdsDataService
}

export default RDSDataService

export { result }
