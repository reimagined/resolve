import loadEventsByCursor from '../src/load-events-by-cursor'
import escapeId from '../src/escape-id'
import escape from '../src/escape'
import shapeEvent from '../src/shape-event'
import isTimeoutError from '../src/is-timeout-error'

const injectNumber = (value: any): string => `${+value}`

// Although documentation describes a 1 MB limit, the actual limit is 512 KB
// https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html
const MAX_RDS_DATA_API_RESPONSE_SIZE = 512000

const DEFAULT_EVENTS_COUNT_LIMIT = 100

test(`method "loadEventsByCursor" should execute a correct SQL with limit lower ${MAX_RDS_DATA_API_RESPONSE_SIZE} bytes`, async () => {
  const eventsTableName = 'eventsTableName'
  const databaseName = 'databaseName'

  const executeStatement = jest.fn().mockReturnValue([])
  const eventTypes = undefined
  const aggregateIds = undefined
  const eventsSizeLimit = MAX_RDS_DATA_API_RESPONSE_SIZE - 1
  const limit = DEFAULT_EVENTS_COUNT_LIMIT

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
    `WHERE "sizedEvents"."summaryEventSize" < ${injectNumber(eventsSizeLimit)}`
  )
})

test(`method "loadEventsByCursor" should execute a correct SQL with limit higher ${MAX_RDS_DATA_API_RESPONSE_SIZE} bytes`, async () => {
  const eventsTableName = 'eventsTableName'
  const databaseName = 'databaseName'

  const executeStatement = jest.fn().mockReturnValue([])
  const eventTypes = undefined
  const aggregateIds = undefined
  const eventsSizeLimit = MAX_RDS_DATA_API_RESPONSE_SIZE + 1
  const limit = DEFAULT_EVENTS_COUNT_LIMIT

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
