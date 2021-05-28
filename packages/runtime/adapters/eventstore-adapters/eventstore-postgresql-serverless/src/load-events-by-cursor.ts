import { INT8_SQL_TYPE } from './constants'
import { AdapterPool } from './types'
import {
  CursorFilter,
  cursorToThreadArray,
  threadArrayToCursor,
} from '@resolve-js/eventstore-base'

// Although documentation describes a 1 MB limit, the actual limit is 512 KB
// https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html
const MAX_RDS_DATA_API_RESPONSE_SIZE = 512000

const loadEventsByCursor = async (
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
    cursor,
    limit: inputLimit,
    eventsSizeLimit: inputEventsSizeLimit,
  }: CursorFilter
) => {
  const eventsSizeLimit =
    inputEventsSizeLimit != null
      ? inputEventsSizeLimit
      : MAX_RDS_DATA_API_RESPONSE_SIZE
  const limit = Math.min(inputLimit, 0x7fffffff)

  const injectString = (value: any): string => `${escape(value)}`
  const injectNumber = (value: any): string => `${+value}`

  const vectorConditions = cursorToThreadArray(cursor)

  const queryConditions: string[] = ['1=1']
  if (eventTypes != null) {
    queryConditions.push(`"type" IN (${eventTypes.map(injectString)})`)
  }
  if (aggregateIds != null) {
    queryConditions.push(`"aggregateId" IN (${aggregateIds.map(injectString)})`)
  }

  const resultQueryCondition: string = queryConditions.join(' AND ')
  const resultVectorConditions: string = vectorConditions
    .map(
      (threadCounter, threadId) =>
        `"threadId"=${injectNumber(
          threadId
        )} AND "threadCounter">=${threadCounter}::${INT8_SQL_TYPE}`
    )
    .join(' OR ')
  const resultTimestampConditions: string = vectorConditions
    .map(
      (threadCounter, threadId) =>
        `"threadId"=${injectNumber(
          threadId
        )} AND "threadCounter"=${threadCounter}::${INT8_SQL_TYPE}`
    )
    .join(' OR ')

  const databaseNameAsId: string = escapeId(databaseName)
  const eventsTableAsId: string = escapeId(eventsTableName)
  const events: any[] = []

  if (eventsSizeLimit > MAX_RDS_DATA_API_RESPONSE_SIZE) {
    // prettier-ignore
    const sqlQuery: any =
      `WITH "minimalTimestamp" AS (
        SELECT MIN("timestamp") AS "value" FROM ${databaseNameAsId}.${eventsTableAsId}
        WHERE ${resultTimestampConditions}
      ), "batchEvents" AS (
        SELECT "threadId", "threadCounter",
        SUM("eventSize") OVER (ORDER BY "timestamp", "threadId", "threadCounter") AS "totalEventsSize",
        FLOOR((SUM("eventSize") OVER (ORDER BY "timestamp", "threadId", "threadCounter")) / 128000) AS "batchIndex"
        FROM ${databaseNameAsId}.${eventsTableAsId}
        WHERE (${resultQueryCondition}) AND (${resultVectorConditions})
        AND "timestamp" >= (SELECT "minimalTimestamp"."value" FROM "minimalTimestamp")
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
        events.push(event)
      }
    }
  } else {
    // prettier-ignore
    const sqlQuery = `
      WITH RECURSIVE "cumulateEvents"("threadId", "threadCounter", "eventSize", "timestamp") AS (
        (SELECT CAST(256 AS BIGINT) AS "threadId", CAST(9223372036854775807 AS BIGINT) AS "threadCounter",
        CAST(0 AS BIGINT) AS "eventSize", CAST(9223372036854775807 AS BIGINT) AS "timestamp")
      UNION ALL
        (WITH "R" AS (SELECT "cumulateEvents"."threadId" AS "currentThreadId" FROM "cumulateEvents"),
        "M" AS (SELECT COALESCE(MAX("R"."currentThreadId"), 256) AS "maxThreadId" FROM "R" WHERE "R"."currentThreadId" < 256),
        "V" AS ((SELECT "threadId", "threadCounter", "eventSize", "timestamp"
        FROM ${databaseNameAsId}.${eventsTableAsId}
        WHERE (${resultQueryCondition}) AND "threadId" = (SELECT COALESCE(NULLIF("M"."maxThreadId", 256) + 1, 0) FROM "M")
        AND (SELECT COALESCE(NULLIF("M"."maxThreadId", 256), 0) FROM "M") < 256 - 1
        AND "threadCounter" >= (
          SELECT "threadCounters"."threadCounter" FROM "threadCounters"
          WHERE "threadCounters"."threadId" = (SELECT COALESCE(NULLIF("M"."maxThreadId", 256) + 1, 0) FROM "M")
        )
        ORDER BY "threadCounter"
        LIMIT ${limit}
        ) UNION ALL (
        SELECT (SELECT COALESCE(NULLIF("M"."maxThreadId", 256) + 1, 0) FROM "M") AS "threadId",
        CAST(9223372036854775807 AS BIGINT) AS "threadCounter",
        CAST(0 AS BIGINT) AS "eventSize",
        CAST(9223372036854775807 AS BIGINT) AS "timestamp"
        WHERE (SELECT COALESCE(NULLIF("M"."maxThreadId", 256), 0) FROM "M") < 256 - 1
        ))
        SELECT * FROM "V"
      )), "threadCounters" AS (
        SELECT UNNEST(ARRAY[${vectorConditions.map((_,idx)=>idx).join(',')}]) AS "threadId",
        UNNEST(ARRAY[${vectorConditions.join(',')}]) AS "threadCounter"
      ), "filteredEvents" AS (
        SELECT * FROM "cumulateEvents" 
        WHERE "threadCounter" < 9223372036854775807
      ), "sizedEvents" AS (
        SELECT *, SUM("eventSize") OVER (ORDER BY "timestamp", "threadCounter", "threadId") AS "summaryEventSize"
        FROM "filteredEvents" 
        ORDER BY "timestamp", "threadCounter", "threadId"
        LIMIT ${limit}
      )
      SELECT "E".* FROM "sizedEvents" LEFT JOIN ${databaseNameAsId}.${eventsTableAsId} "E"
      ON "E"."threadId" = "sizedEvents"."threadId"
      AND "E"."threadCounter" = "sizedEvents"."threadCounter"
      WHERE "sizedEvents"."summaryEventSize" < ${injectNumber(eventsSizeLimit)}
      ORDER BY "sizedEvents"."timestamp", "sizedEvents"."threadCounter", "sizedEvents"."threadId"
      LIMIT ${limit}
    `

    while (true) {
      try {
        events.push(...(await executeStatement(sqlQuery)))
        break
      } catch (err) {
        if (isTimeoutError(err)) {
          continue
        }
        throw err
      }
    }
  }

  const resultEvents: any[] = []
  for (const event of events) {
    const threadId = +event.threadId
    const threadCounter = +event.threadCounter
    const oldThreadCounter = vectorConditions[threadId]
    vectorConditions[threadId] = Math.max(threadCounter + 1, oldThreadCounter)

    resultEvents.push(shapeEvent(event))
  }

  const nextConditions = threadArrayToCursor(vectorConditions)

  return {
    cursor: nextConditions,
    events: resultEvents,
  }
}

export default loadEventsByCursor
