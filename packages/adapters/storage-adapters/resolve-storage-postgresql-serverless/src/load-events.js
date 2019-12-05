import { RESPONSE_SIZE_LIMIT } from './constants'

const loadEvents = async (
  { executeStatement, escapeId, escape, tableName, databaseName },
  {
    eventTypes,
    aggregateIds,
    startTime,
    finishTime,
    maxEventsByTimeframe = Number.POSITIVE_INFINITY
  },
  callback
) => {
  const injectString = value => `${escape(value)}`
  const injectNumber = value => `${+value}`
  const batchSize = 200

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
      `${escapeId('timestamp')} > ${injectNumber(startTime)}`
    )
  }
  if (finishTime != null) {
    queryConditions.push(
      `${escapeId('timestamp')} < ${injectNumber(finishTime)}`
    )
  }

  const resultQueryCondition =
    queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : ''

  let initialTimestamp = null
  let countEvents = 0

  loop: while (true) {
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
              'eventId'
            )})`,
            `  AS ${escapeId('totalEventSize')}`,
            `  FROM (`,
            `    SELECT * FROM ${escapeId(databaseName)}.${escapeId(
              tableName
            )}`,
            `    ${resultQueryCondition}`,
            `    ORDER BY ${escapeId('eventId')} ASC`,
            `    OFFSET ${+countEvents}`,
            `    LIMIT ${+dynamicBatchSize}`,
            `  ) ${escapeId('filteredEvents')}`,
            `)`,
            `SELECT * FROM ${escapeId('cte')}`,
            `WHERE ${escapeId('cte')}.${escapeId('totalEventSize')} < 512000`,
            `ORDER BY ${escapeId('cte')}.${escapeId('eventId')} ASC`
          ].join('\n')
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

    for (const event of rows) {
      if (initialTimestamp == null) {
        initialTimestamp = event.timestamp
      }

      if (
        countEvents++ > maxEventsByTimeframe &&
        event.timestamp !== initialTimestamp
      ) {
        break loop
      }

      event.payload = JSON.parse(event.payload)
      delete event.totalEventSize
      delete event.eventSize

      await callback(event)
    }

    if (rows.length === 0) {
      break
    }
  }
}

export default loadEvents
