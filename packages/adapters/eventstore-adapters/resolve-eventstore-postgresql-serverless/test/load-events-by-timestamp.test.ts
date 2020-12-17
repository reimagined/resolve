import loadEventsByTimestamp from '../src/js/load-events-by-timestamp'
import escapeId from '../src/js/escape-id'
import escape from '../src/js/escape'
import shapeEvent from '../src/js/shape-event'
import isTimeoutError from '../src/js/is-timeout-error'

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
      isTimeoutError,
    },
    { eventTypes, aggregateIds, startTime, finishTime, limit }
  )

  const sql = executeStatement.mock.calls.join(';')

  expect(sql).toContain(`"timestamp" >= ${startTime}`)
  expect(sql).toContain(`"timestamp" <= ${finishTime}`)
})
