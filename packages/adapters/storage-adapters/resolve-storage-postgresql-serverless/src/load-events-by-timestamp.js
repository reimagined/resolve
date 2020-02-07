import { RESPONSE_SIZE_LIMIT } from './constants'

const loadEventsByTimestamp = async (
  { executeStatement, escapeId, escape, tableName, databaseName },
  { eventTypes, aggregateIds, startTime, finishTime, limit },
  callback
) => {
  const injectString = value => `${escape(value)}`
  const injectNumber = value => `${+value}`
  const batchSize = limit != null ? Math.min(limit, 200) : 200

  const queryConditions = []
  if (eventTypes != null) {
    queryConditions.push(
      `${escapeId('type')} IN (${eventTypes.map(injectString)})`
    )
  }
  if (aggregateIds != null) {
    queryConditions.push(
      `${escapeId('aggregateId')} IN (${aggregateIds.map(injectString)})`
    )
  }
  if (startTime != null) {
    queryConditions.push(
      `${escapeId('startTime')} >= ${injectNumber(startTime)}`
    )
  }
  if (finishTime != null) {
    queryConditions.push(
      `${escapeId('finishTime')} <= ${injectNumber(finishTime)}`
    )
  }

  const resultQueryCondition =
    queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : ''

  let countEvents = 0

  while (true) {
    let rows = RESPONSE_SIZE_LIMIT
    for (
      let dynamicBatchSize = batchSize;
      dynamicBatchSize >= 1;
      dynamicBatchSize = Math.floor(dynamicBatchSize / 1.5)
    ) {
      try {
        const sqlQuery = [
          `WITH ${escapeId('cte')} AS (`,
          `  SELECT ${escapeId('filteredEvents')}.*,`,
          `  SUM(${escapeId('filteredEvents')}.${escapeId('eventSize')})`,
          `  OVER (ORDER BY ${escapeId('filteredEvents')}.${escapeId(
            'timestamp'
          )})`,
          `  AS ${escapeId('totalEventSize')}`,
          `  FROM (`,
          `    SELECT * FROM ${escapeId(databaseName)}.${escapeId(tableName)}`,
          `    ${resultQueryCondition}`,
          `    ORDER BY ${escapeId('timestamp')} ASC`,
          `    LIMIT ${+dynamicBatchSize}`,
          `  ) ${escapeId('filteredEvents')}`,
          `)`,
          `SELECT * FROM ${escapeId('cte')}`,
          `WHERE ${escapeId('cte')}.${escapeId('totalEventSize')} < 512000`,
          `ORDER BY ${escapeId('cte')}.${escapeId('timestamp')} ASC`
        ].join('\n')

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
      event.payload = JSON.parse(event.payload)

      delete event.totalEventSize
      delete event.eventSize
      delete event.threadCounter
      delete event.threadId

      countEvents++

      await callback(event)
    }

    if (rows.length === 0 || countEvents > limit) {
      break
    }
  }
}

export default loadEventsByTimestamp
