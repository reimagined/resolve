const result = []

const promise = jest.fn().mockReturnValue(
  Promise.resolve({
    sqlStatementResults: [
      {
        resultFrame: {
          records: [
            {
              values: [
                { intValue: 10 },
                { bigIntValue: 1000 },
                { stringValue: '{}' }
              ]
            }
          ],
          resultSetMetadata: {
            columnCount: 3,
            columnMetadata: [
              { name: 'aggregateVersion' },
              { name: 'eventId' },
              { name: 'payload' }
            ]
          }
        }
      }
    ]
  })
)

const rdsDataService = {
  executeSql: jest.fn().mockImplementation((...args) => {
    result.push('executeSql', ...args)
    return { promise }
  })
}

const RDSDataService = function() {
  return rdsDataService
}

export default RDSDataService

export { result }
