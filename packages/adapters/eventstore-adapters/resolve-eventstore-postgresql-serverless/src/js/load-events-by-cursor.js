import { INT8_SQL_TYPE } from './constants'

const split2RegExp = /.{1,2}(?=(.{2})+(?!.))|.{1,2}$/g

const loadEventsByCursor = async (
  {
    executeStatement,
    escapeId,
    escape,
    eventsTableName,
    databaseName,
    shapeEvent,
    isTimeoutError,
  },
  {
    eventTypes,
    aggregateIds,
    cursor,
    limit,
    eventsSizeLimit: inputEventsSizeLimit,
  }
) => {
  const eventsSizeLimit =
    inputEventsSizeLimit != null ? inputEventsSizeLimit : 2000000000

  const makeBigIntLiteral = (numStr) => `x'${numStr}'::${INT8_SQL_TYPE}`
  const parseBigIntString = (str) =>
    str.substring(2, str.length - (INT8_SQL_TYPE.length + 3))

  const injectBigInt = (value) =>
    makeBigIntLiteral((+value).toString(16).padStart(12, '0'))
  const injectString = (value) => `${escape(value)}`
  const injectNumber = (value) => `${+value}`

  const cursorBuffer =
    cursor != null ? Buffer.from(cursor, 'base64') : Buffer.alloc(1536, 0)
  const vectorConditions = []
  for (let i = 0; i < cursorBuffer.length / 6; i++) {
    vectorConditions.push(
      makeBigIntLiteral(cursorBuffer.slice(i * 6, (i + 1) * 6).toString('hex'))
    )
  }

  const queryConditions = ['1=1']
  if (eventTypes != null) {
    queryConditions.push(`"type" IN (${eventTypes.map(injectString)})`)
  }
  if (aggregateIds != null) {
    queryConditions.push(`"aggregateId" IN (${aggregateIds.map(injectString)})`)
  }

  const resultQueryCondition = queryConditions.join(' AND ')
  const resultVectorConditions = vectorConditions
    .map(
      (threadCounter, threadId) =>
        `"threadId"=${injectNumber(
          threadId
        )} AND "threadCounter">=${threadCounter}`
    )
    .join(' OR ')
  const resultTimestampConditions = vectorConditions
    .map(
      (threadCounter, threadId) =>
        `"threadId"=${injectNumber(
          threadId
        )} AND "threadCounter"=${threadCounter}`
    )
    .join(' OR ')

  const databaseNameAsId = escapeId(databaseName)
  const eventsTableAsId = escapeId(eventsTableName)

  // prettier-ignore
  const sqlQuery =
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

  let batchList = null
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

  const requestCursors = []
  const requestPromises = []
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
      `"threadId"= ${+threadId} AND "threadCounter" BETWEEN ${injectBigInt(
        threadCounterStart
      )} AND ${injectBigInt(threadCounterEnd)}`
    )
  }

  for (let i = 0; i < requestCursors.length; i++) {
    const batchCursor = requestCursors[i]
    if (batchCursor == null || batchCursor.length === 0) {
      continue
    }

    const sqlQuery = `SELECT * FROM ${databaseNameAsId}.${eventsTableAsId}
    WHERE ${
      queryConditions.length > 0 ? `${queryConditions.join(' AND ')} AND (` : ''
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

  const batchedEvents = await Promise.all(requestPromises)
  const events = []
  for (const eventBatch of batchedEvents) {
    for (const event of eventBatch) {
      events.push(event)
    }
  }

  const resultEvents = []
  for (const event of events) {
    const threadId = +event.threadId
    const threadCounter = +event.threadCounter
    const oldThreadCounter = parseInt(
      parseBigIntString(vectorConditions[threadId]),
      16
    )
    vectorConditions[threadId] = injectBigInt(
      Math.max(threadCounter + 1, oldThreadCounter)
    )

    resultEvents.push(shapeEvent(event))
  }

  const nextConditionsBuffer = Buffer.alloc(1536)
  let byteIndex = 0

  for (const threadCounter of vectorConditions) {
    const threadCounterBytes = parseBigIntString(threadCounter).match(
      split2RegExp
    )
    for (const byteHex of threadCounterBytes) {
      nextConditionsBuffer[byteIndex++] = parseInt(byteHex, 16)
    }
  }

  return {
    cursor: nextConditionsBuffer.toString('base64'),
    events: resultEvents,
  }
}

export default loadEventsByCursor
