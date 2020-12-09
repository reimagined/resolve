import loadEventsByTimestamp from '../src/js/load-events-by-timestamp'
import escapeId from '../src/js/escape-id'
import escape from '../src/js/escape'
import shapeEvent from '../src/js/shape-event'
import isTimeoutError from '../src/js/is-timeout-error'

const databaseName = 'databaseName'
const eventsTableName = 'eventsTableName'

test('loadEventsByTimestamp has correct filters', async () => {
  const executeStatement = jest.fn().mockImplementation(() => [])

  const pool = {
    escape,
    eventsTableName,
    databaseName,
    executeStatement,
    escapeId,
    shapeEvent,
    isTimeoutError,
  }

  const filter = {
    eventTypes: ['test'],
    aggregateIds: ['test-1'],
    startTime: Date.now(),
    finishTime: Date.now(),
    limit: 1,
  }

  const eventTypesExpanded = filter.eventTypes.map((e) => escape(e)).join(',')
  const aggregateIdsExpanded = filter.aggregateIds
    .map((e) => escape(e))
    .join(',')

  await loadEventsByTimestamp(pool, filter)

  // prettier-ignore
  expect(pool.executeStatement)
    .toHaveBeenCalledWith(`WITH "filteredEvents" AS (
            SELECT * FROM ${escapeId(databaseName)}.${escapeId(eventsTableName)}
            WHERE "type" IN (${eventTypesExpanded}) AND "aggregateId" IN (${aggregateIdsExpanded}) AND "timestamp" >= ${filter.startTime} AND "timestamp" <= ${filter.finishTime}
            ORDER BY "timestamp" ASC, "threadCounter" ASC, "threadId" ASC
            LIMIT 1
          ), "sizedEvents" AS (
            SELECT "filteredEvents".*,
            SUM("filteredEvents"."eventSize") OVER (
              ORDER BY "filteredEvents"."timestamp",
              "filteredEvents"."threadCounter",
              "filteredEvents"."threadId"
            ) AS "totalEventSize"
            FROM "filteredEvents"
          )
          SELECT * FROM "sizedEvents"
          WHERE "sizedEvents"."totalEventSize" < 512000
          ORDER BY "sizedEvents"."timestamp" ASC
          "sizedEvents"."threadCounter" ASC,
          "sizedEvents"."threadId" ASC
          `)
})
