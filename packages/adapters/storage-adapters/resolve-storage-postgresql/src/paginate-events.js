import { RESPONSE_SIZE_LIMIT } from './constants'

const paginateEvents = async (pool, offset, batchSize) => {
  const { escapeId, tableName, databaseName, executeStatement } = pool

  let rows = RESPONSE_SIZE_LIMIT

  for (
    let dynamicBatchSize = batchSize;
    dynamicBatchSize >= 1;
    dynamicBatchSize = Math.floor(dynamicBatchSize / 1.5)
  ) {
    try {
      rows = await executeStatement(
        [
          `WITH ${escapeId('cte')} AS (`,
          `  SELECT ${escapeId('filteredEvents')}.*,`,
          `  SUM(${escapeId('filteredEvents')}.${escapeId('eventSize')})`,
          `  OVER (ORDER BY ${escapeId('filteredEvents')}.${escapeId(
            'timestamp'
          )}) AS ${escapeId('totalEventSize')}`,
          `  FROM (`,
          `    SELECT * FROM ${escapeId(databaseName)}.${escapeId(tableName)}`,
          `    ORDER BY ${escapeId('timestamp')} ASC`,
          `    OFFSET ${offset}`,
          `    LIMIT ${+dynamicBatchSize}`,
          `  ) ${escapeId('filteredEvents')}`,
          `)`,
          `SELECT * FROM ${escapeId('cte')}`,
          `WHERE ${escapeId('cte')}.${escapeId('totalEventSize')} < 512000`,
          `ORDER BY ${escapeId('cte')}.${escapeId('timestamp')} ASC`
        ].join(' ')
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
  for (const event of rows) {
    event[Symbol.for('sequenceIndex')] = offset + eventOffset
    eventOffset++

    delete event.totalEventSize
    delete event.eventSize
  }

  return rows
}

export default paginateEvents
