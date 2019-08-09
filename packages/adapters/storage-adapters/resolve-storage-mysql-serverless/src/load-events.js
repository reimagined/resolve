const loadEvents = async (
  { executeStatement, escapeId, escapeUnicode, tableName },
  {
    eventTypes,
    aggregateIds,
    startTime,
    finishTime,
    maxEventsByTimeframe = Number.POSITIVE_INFINITY
  },
  callback
) => {
  const injectString = value => `${escapeUnicode(value)}`
  const injectNumber = value => `${+value}`
  const batchSize = 50

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

  loop: for (let skipCount = 0; ; skipCount++) {
    const rows = await executeStatement(
      `SELECT * FROM ${escapeId(tableName)} ${resultQueryCondition}
      ORDER BY ${escapeId('eventId')} ASC
      LIMIT ${+(skipCount * batchSize)}, ${+batchSize}`
    )

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

      await callback({
        ...event,
        payload: JSON.parse(event.payload)
      })
    }

    if (rows.length < batchSize) {
      break
    }
  }
}

export default loadEvents
