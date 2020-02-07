const loadEventsByTimestamp = async (
  { executeStatement, escapeId, escape, tableName, databaseName },
  { eventTypes, aggregateIds, startTime, finishTime, limit },
  callback
) => {
  const injectString = value => `${escape(value)}`
  const injectNumber = value => `${+value}`
  const batchSize = limit != null ? Math.min(limit, 0x7fffffff) : 0x7fffffff

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

  const sqlQuery = [
    `SELECT * FROM ${escapeId(databaseName)}.${escapeId(tableName)}`,
    `${resultQueryCondition}`,
    `ORDER BY ${escapeId('timestamp')} ASC`,
    `LIMIT ${+batchSize}`
  ].join('\n')

  const rows = await executeStatement(sqlQuery)

  for (const event of rows) {
    event.aggregateVersion = +event.aggregateVersion
    event.timestamp = +event.timestamp

    delete event.totalEventSize
    delete event.eventSize
    delete event.threadCounter
    delete event.threadId

    await callback(event)
  }
}

export default loadEventsByTimestamp
