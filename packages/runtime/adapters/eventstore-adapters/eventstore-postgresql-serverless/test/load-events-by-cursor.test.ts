import loadEventsByCursor from '../src/load-events-by-cursor'
import escapeId from '../src/escape-id'
import escape from '../src/escape'
import shapeEvent from '../src/shape-event'
import isTimeoutError from '../src/is-timeout-error'

const injectNumber = (value: any): string => `${+value}`

test('method "loadEventsByCursor" should execute a correct SQL with limit lower 512000 bytes', async () => {
  const eventsTableName = 'eventsTableName'
  const databaseName = 'databaseName'

  const executeStatement = jest.fn().mockReturnValue([])
  const eventTypes = undefined
  const aggregateIds = undefined
  const eventsSizeLimit = 100000
  const limit = 100

  await loadEventsByCursor(
    {
      executeStatement,
      escapeId,
      escape,
      eventsTableName,
      databaseName,
      shapeEvent,
      isTimeoutError,
    } as any,
    { eventTypes, aggregateIds, limit, eventsSizeLimit } as any
  )

  const sql = executeStatement.mock.calls.join(';')

  expect(sql).toContain(
    `AND "cumulatedEventSize" < ${injectNumber(eventsSizeLimit)}`
  )
  expect(sql).toContain(
    `WHERE "sizedEvents"."summaryEventSize" < ${injectNumber(eventsSizeLimit)}`
  )
})

test('method "loadEventsByCursor" should execute a correct SQL with limit higher 512000 bytes', async () => {
  const eventsTableName = 'eventsTableName'
  const databaseName = 'databaseName'

  const executeStatement = jest.fn().mockReturnValue([])
  const eventTypes = undefined
  const aggregateIds = undefined
  const eventsSizeLimit = 1000000
  const limit = 100

  await loadEventsByCursor(
    {
      executeStatement,
      escapeId,
      escape,
      eventsTableName,
      databaseName,
      shapeEvent,
      isTimeoutError,
    } as any,
    { eventTypes, aggregateIds, limit, eventsSizeLimit } as any
  )

  const sql = executeStatement.mock.calls.join(';')

  expect(sql).toContain(
    `WHERE "batchEvents"."totalEventsSize" < ${+eventsSizeLimit}`
  )
})
