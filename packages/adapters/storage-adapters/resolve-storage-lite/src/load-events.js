const loadEvents = async (
  { database, escapeId, escape, tableName },
  {
    eventTypes,
    aggregateIds,
    startTime,
    finishTime,
    maxEvents = Number.POSITIVE_INFINITY
  },
  callback
) => {
  const injectString = value => `${escape(value)}`
  const injectNumber = value => `${+value}`
  // TODO
  const batchSize = 1000

  const queryConditions = []
  if (eventTypes != null) {
    queryConditions.push(
      `${escapeId('type')} IN (${eventTypes.map(injectString).join(', ')})`
    )
  }
  if (aggregateIds != null) {
    queryConditions.push(
      `${escapeId('aggregateId')} IN (${aggregateIds
        .map(injectString)
        .join(', ')})`
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
    const rows = await database.all(
      `SELECT * FROM ${escapeId(tableName)} ${resultQueryCondition}
      ORDER BY ${escapeId('timestamp')} ASC,
      ${escapeId('aggregateVersion')} ASC
      LIMIT ${+(skipCount * batchSize)}, ${+batchSize}`
    )

    for (const event of rows) {
      await callback({
        ...event,
        payload: JSON.parse(event.payload)
      })

      if (initialTimestamp == null) {
        initialTimestamp = event.timestamp
      }

      if (countEvents++ > maxEvents && event.timestamp !== initialTimestamp) {
        break loop
      }
    }

    if (rows.length < batchSize) {
      break
    }
  }
}

export default loadEvents
