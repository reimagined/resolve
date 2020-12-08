import loadEventsByTimestamp from '../src/js/load-events-by-timestamp'

jest.mock('../src/js/get-log')
jest.mock('../src/js/drop', () => jest.fn())

type ArgType = {
  escapeId: any
  escape: any
  eventsTableName: any
  databaseName: any
  executeStatement: any
  shapeEvent: any
}

let arg1: ArgType

beforeEach(() => {
  arg1 = {
    escape: jest.fn((v) => v),
    eventsTableName: 'events-table-name',
    databaseName: 'database',
    executeStatement: jest.fn(() => []),
    escapeId: jest.fn((v) => `${v}`),
    shapeEvent: jest.fn(),
  }
})

test('loadEventsByTimestamp has correct filters', async () => {
  const filter = {
    eventTypes: ['test'],
    aggregateIds: ['test-1'],
    startTime: Date.now(),
    finishTime: Date.now(),
    limit: 1,
  }
  await loadEventsByTimestamp(arg1, filter)

  // prettier-ignore
  expect(arg1.executeStatement)
    .toHaveBeenCalledWith(`SELECT * FROM ${arg1.databaseName}.${arg1.eventsTableName}
WHERE "type" IN (${filter.eventTypes.join(',')}) AND "aggregateId" IN (${filter.aggregateIds.join(',')}) AND "timestamp" >= ${filter.startTime} AND "timestamp" <= ${filter.finishTime}
ORDER BY "timestamp" ASC, "threadCounter" ASC, "threadId" ASC
LIMIT ${filter.limit}`)
})
