const result = []

const executeStatementPromise = jest.fn().mockReturnValue(
  Promise.resolve({
    records: [[{ intValue: 10 }, { bigIntValue: 1000 }, { stringValue: '{}' }]],
    columnMetadata: [
      { name: 'aggregateVersion' },
      { name: 'eventId' },
      { name: 'payload' }
    ]
  })
)

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
    return { promise: beginTransactionPromise }
  }),
  commitTransaction: jest.fn().mockImplementation((...args) => {
    result.push('commitTransaction', ...args)
    return { promise: commitTransactionPromise }
  }),
  rollbackTransaction: jest.fn().mockImplementation((...args) => {
    result.push('rollbackTransaction', ...args)
    return { promise: rollbackTransactionPromise }
  }),
  executeStatement: jest.fn().mockImplementation((...args) => {
    result.push('executeStatement', ...args)
    return { promise: executeStatementPromise }
  })
}

const RDSDataService = function() {
  return rdsDataService
}

export default RDSDataService

export { result }
