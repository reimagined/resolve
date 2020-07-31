import { throwBadCursor } from 'resolve-eventstore-base'

import { RESPONSE_SIZE_LIMIT } from './constants'

const loadEventsByTimestamp = async (
  {
    executeStatement,
    escapeId,
    escape,
    eventsTableName,
    databaseName,
    shapeEvent
  },
  { eventTypes, aggregateIds, startTime, finishTime, limit }
) => {
  const injectString = value => `${escape(value)}`
  const injectNumber = value => `${+value}`
  const batchSize = limit != null ? Math.min(limit, 200) : 200

  const queryConditions = []
  if (eventTypes != null) {
    queryConditions.push(`"type" IN (${eventTypes.map(injectString)})`)
  }
  if (aggregateIds != null) {
    queryConditions.push(`"aggregateId" IN (${aggregateIds.map(injectString)})`)
  }
  if (startTime != null) {
    queryConditions.push(`"startTime" >= ${injectNumber(startTime)}`)
  }
  if (finishTime != null) {
    queryConditions.push(`"finishTime" <= ${injectNumber(finishTime)}`)
  }

  const resultQueryCondition =
    queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : ''

  const databaseNameAsId = escapeId(databaseName)
  const eventsTableAsId = escapeId(eventsTableName)
  let countEvents = 0
  const events = []

  while (true) {
    let rows = RESPONSE_SIZE_LIMIT
    for (
      let dynamicBatchSize = batchSize;
      dynamicBatchSize >= 1;
      dynamicBatchSize = Math.floor(dynamicBatchSize / 1.5)
    ) {
      try {
        // prettier-ignore
        const sqlQuery =
          `WITH "filteredEvents" AS (
            SELECT * FROM ${databaseNameAsId}.${eventsTableAsId}
            ${resultQueryCondition}
            ORDER BY "timestamp" ASC, "threadCounter" ASC, "threadId" ASC
            LIMIT ${+dynamicBatchSize}
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
          `

        while (true) {
          try {
            rows = await executeStatement(sqlQuery)
            break
          } catch (err) {
            if (err != null && /StatementTimeoutException/i.test(err.message)) {
              continue
            }
            throw err
          }
        }
        break
      } catch (error) {
        if (!/Database response exceeded size limit/.test(error.message)) {
          throw error
        }
      }
    }
    if (rows === RESPONSE_SIZE_LIMIT) {
      throw new Error('Database response exceeded size limit')
    }

    for (const event of rows) {
      countEvents++
      events.push(shapeEvent(event))
    }

    if (rows.length === 0 || countEvents >= limit) {
      break
    }
  }

  return {
    get cursor() {
      return throwBadCursor()
    },
    events
  }
}

export default loadEventsByTimestamp
