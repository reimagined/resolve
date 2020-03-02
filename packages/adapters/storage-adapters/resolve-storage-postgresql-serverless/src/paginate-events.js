import { RESPONSE_SIZE_LIMIT } from './constants'

const paginateEvents = async (pool, offset, batchSize) => {
  const {
    escapeId,
    tableName,
    databaseName,
    executeStatement,
    shapeEvent
  } = pool

  let rows = RESPONSE_SIZE_LIMIT
  const databaseNameAsId = escapeId(databaseName)
  const eventsTableNameAsId = escapeId(tableName)

  for (
    let dynamicBatchSize = batchSize;
    dynamicBatchSize >= 1;
    dynamicBatchSize = Math.floor(dynamicBatchSize / 1.5)
  ) {
    try {
      rows = await executeStatement(
        `WITH "filteredEvents" AS (
          SELECT * FROM ${databaseNameAsId}.${eventsTableNameAsId}
          ORDER BY "timestamp" ASC
          OFFSET ${offset}
          LIMIT ${+dynamicBatchSize}        
        ), "sizedEvents" AS (
          SELECT "filteredEvents".*,
          SUM("filteredEvents"."eventSize") OVER (
            ORDER BY "filteredEvents"."timestamp"
          ) AS "totalEventSize"
          FROM "filteredEvents"
        ) SELECT * FROM "sizedEvents"
        WHERE "sizedEvents"."totalEventSize" < 512000
        ORDER BY "sizedEvents"."timestamp" ASC
        `
      )
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

  let eventOffset = 0
  const resultRows = []
  for (const event of rows) {
    resultRows.push(
      shapeEvent(event, {
        [Symbol.for('sequenceIndex')]: offset + eventOffset
      })
    )
    eventOffset++
  }

  return resultRows
}

export default paginateEvents
