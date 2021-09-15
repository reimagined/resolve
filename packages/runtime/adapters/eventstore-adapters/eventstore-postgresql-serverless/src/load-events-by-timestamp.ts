import {
  TimestampFilter,
  throwBadCursor,
  StoredEventBatchPointer,
} from '@resolve-js/eventstore-base'
import { AdapterPool } from './types'
import { INT8_SQL_TYPE, MAX_RDS_DATA_API_RESPONSE_SIZE } from './constants'

const loadEventsByTimestamp = async (
  {
    executeStatement,
    escapeId,
    escape,
    eventsTableName,
    databaseName,
    shapeEvent,
    isTimeoutError,
  }: AdapterPool,
  {
    eventTypes,
    aggregateIds,
    startTime,
    finishTime,
    limit,
    eventsSizeLimit: inputEventsSizeLimit,
  }: TimestampFilter
): Promise<StoredEventBatchPointer> => {
  const eventsSizeLimit =
    inputEventsSizeLimit != null
      ? inputEventsSizeLimit
      : MAX_RDS_DATA_API_RESPONSE_SIZE

  const injectString = (value: any): string => `${escape(value)}`
  const injectNumber = (value: any): string => `${+value}`

  const queryConditions: any[] = []
  if (eventTypes != null) {
    queryConditions.push(`"type" IN (${eventTypes.map(injectString)})`)
  }
  if (aggregateIds != null) {
    queryConditions.push(`"aggregateId" IN (${aggregateIds.map(injectString)})`)
  }
  if (startTime != null) {
    queryConditions.push(`"timestamp" >= ${injectNumber(startTime)}`)
  }
  if (finishTime != null) {
    queryConditions.push(`"timestamp" <= ${injectNumber(finishTime)}`)
  }

  const resultQueryCondition: string =
    queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : ''

  const databaseNameAsId: string = escapeId(databaseName)
  const eventsTableAsId: string = escapeId(eventsTableName)

  const events: any[] = []
  if (eventsSizeLimit > MAX_RDS_DATA_API_RESPONSE_SIZE) {
    // prettier-ignore
    const sqlQuery: any =
      `WITH "batchEvents" AS (
        SELECT "threadId", "threadCounter",
        SUM("eventSize") OVER (ORDER BY "timestamp", "threadId", "threadCounter") AS "totalEventsSize",
        FLOOR((SUM("eventSize") OVER (ORDER BY "timestamp", "threadId", "threadCounter")) / 128000) AS "batchIndex"
        FROM ${databaseNameAsId}.${eventsTableAsId}
        ${resultQueryCondition}
        AND "timestamp" >= ${injectNumber(startTime)}
        ORDER BY "timestamp" ASC, "threadCounter" ASC, "threadId" ASC
        LIMIT ${+limit}
      ), "fullBatchList" AS (
        SELECT "batchEvents"."batchIndex" AS "batchIndex",
        "batchEvents"."threadId" AS "threadId",
        MIN("batchEvents"."threadCounter") AS "threadCounterStart",
        MAX("batchEvents"."threadCounter") AS "threadCounterEnd"
        FROM "batchEvents"
        WHERE "batchEvents"."totalEventsSize" < ${+eventsSizeLimit}
        GROUP BY "batchEvents"."batchIndex",
        "batchEvents"."threadId"
        ORDER BY "batchEvents"."batchIndex"
      ), "limitedBatchList" AS (
        SELECT "fullBatchList".* FROM "fullBatchList"
        ORDER BY "fullBatchList"."batchIndex"       
        LIMIT 74700
      ), "threadIdsPerFullBatchList" AS (
        SELECT "fullBatchList"."batchIndex",
        COUNT(DISTINCT "fullBatchList"."threadId") AS "value"
        FROM "fullBatchList"
        GROUP BY "fullBatchList"."batchIndex"
      ), "threadIdsPerLimitedBatchList" AS (
        SELECT "limitedBatchList"."batchIndex",
        COUNT(DISTINCT "limitedBatchList"."threadId") AS "value"
        FROM "limitedBatchList"
        GROUP BY "limitedBatchList"."batchIndex"
      )
      SELECT "limitedBatchList".* FROM "limitedBatchList"
      LEFT JOIN "threadIdsPerFullBatchList" ON 
      "threadIdsPerFullBatchList"."batchIndex" =
        "limitedBatchList"."batchIndex"
      LEFT JOIN "threadIdsPerLimitedBatchList" ON
      "threadIdsPerLimitedBatchList"."batchIndex" =
        "limitedBatchList"."batchIndex"
      WHERE "threadIdsPerFullBatchList"."value" =
        "threadIdsPerLimitedBatchList"."value"
      ORDER BY "limitedBatchList"."batchIndex"`

    let batchList: any = null
    while (true) {
      try {
        batchList = await executeStatement(sqlQuery)
        break
      } catch (err) {
        if (isTimeoutError(err)) {
          continue
        }
        throw err
      }
    }

    const requestCursors: any[] = []
    const requestPromises: any[] = []
    for (const {
      batchIndex,
      threadId,
      threadCounterStart,
      threadCounterEnd,
    } of batchList) {
      if (requestCursors[batchIndex] == null) {
        requestCursors[batchIndex] = []
      }

      requestCursors[batchIndex].push(
        `"threadId"= ${+threadId} AND "threadCounter" BETWEEN 
          ${threadCounterStart}::${INT8_SQL_TYPE} AND 
          ${threadCounterEnd}::${INT8_SQL_TYPE}`
      )
    }

    for (let i = 0; i < requestCursors.length; i++) {
      const batchCursor = requestCursors[i]
      if (batchCursor == null || batchCursor.length === 0) {
        continue
      }

      const sqlQuery: any = `SELECT * FROM ${databaseNameAsId}.${eventsTableAsId}
      WHERE ${
        queryConditions.length > 0
          ? `${queryConditions.join(' AND ')} AND (`
          : ''
      }
      ${batchCursor.join(' OR ')}
      ${queryConditions.length > 0 ? ')' : ''}
      ORDER BY "timestamp" ASC, "threadCounter" ASC, "threadId" ASC
      `

      requestPromises.push(
        (async () => {
          while (true) {
            try {
              return await executeStatement(sqlQuery)
            } catch (err) {
              if (isTimeoutError(err)) {
                continue
              }
              throw err
            }
          }
        })()
      )
    }

    const batchedEvents: any[] = await Promise.all(requestPromises)

    for (const eventBatch of batchedEvents) {
      for (const event of eventBatch) {
        events.push(shapeEvent(event))
      }
    }
  } else {
    let rows: any[]
    // prettier-ignore
    const sqlQuery =
      `WITH "filteredEvents" AS (
        SELECT * FROM ${databaseNameAsId}.${eventsTableAsId}
        ${resultQueryCondition}
        ORDER BY "timestamp" ASC, "threadCounter" ASC, "threadId" ASC
        LIMIT ${+limit}
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
      ORDER BY "sizedEvents"."timestamp" ASC,
      "sizedEvents"."threadCounter" ASC,
      "sizedEvents"."threadId" ASC
      `

    while (true) {
      try {
        rows = await executeStatement(sqlQuery)
        break
      } catch (err) {
        if (isTimeoutError(err)) {
          continue
        }
        throw err
      }
    }

    for (const event of rows) {
      events.push(shapeEvent(event))
    }
  }
  return {
    get cursor() {
      return throwBadCursor() as any
    },
    events,
  }
}

export default loadEventsByTimestamp
