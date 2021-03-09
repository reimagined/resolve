import loadEventsByTimestamp from '../src/load-events-by-timestamp'
import escapeId from '../src/escape-id'
import escape from '../src/escape'
import shapeEvent from '../src/shape-event'

test('method "loadEventsByTimestamp" should execute a correct SQL', async () => {
  const eventsTableName = 'eventsTableName'
  const databaseName = 'databaseName'

  const executeStatement = jest.fn().mockReturnValue([])

  const startTime = 1
  const finishTime = 100
  const eventTypes = undefined
  const aggregateIds = undefined
  const limit = undefined

  await loadEventsByTimestamp(
    {
      executeStatement,
      escapeId,
      escape,
      eventsTableName,
      databaseName,
      shapeEvent,
    } as any,
    { eventTypes, aggregateIds, startTime, finishTime, limit } as any
  )

  const sql = executeStatement.mock.calls.join(';')

  expect(sql).toContain(`"timestamp" >= ${startTime}`)
  expect(sql).toContain(`"timestamp" <= ${finishTime}`)
})
