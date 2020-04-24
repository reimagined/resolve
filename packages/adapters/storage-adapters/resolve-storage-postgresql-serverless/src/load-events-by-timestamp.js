import { RESPONSE_SIZE_LIMIT } from './constants'

const loadEventsByTimestamp = async (
  { executeStatement, escapeId, escape, tableName, databaseName, shapeEvent },
  { eventTypes, aggregateIds, startTime, finishTime, limit },
  callback
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
  const eventsTableAsId = escapeId(tableName)
  let countEvents = 0

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
            ORDER BY "timestamp" ASC
            LIMIT ${+dynamicBatchSize}
          ), "sizedEvents" AS (
            SELECT "filteredEvents".*,
            SUM("filteredEvents"."eventSize") OVER (
              ORDER BY "filteredEvents"."timestamp"
            ) AS "totalEventSize"
            FROM "filteredEvents"
          )
          SELECT * FROM "sizedEvents"
          WHERE "sizedEvents"."totalEventSize" < 512000
          ORDER BY "sizedEvents"."timestamp" ASC`

        rows = await executeStatement(sqlQuery)
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
      await callback(shapeEvent(event))
    }

    if (rows.length === 0 || countEvents > limit) {
      break
    }
  }
}

export default loadEventsByTimestamp
