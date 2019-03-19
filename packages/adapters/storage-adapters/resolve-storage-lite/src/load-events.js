const loadEvents = async (
  { database, escapeId, escape, tableName },
  { eventTypes, aggregateIds, startTime, finishTime },
  callback
) => {
  const injectString = value => `${escape(value)}`
  const injectNumber = value => `${+value}`
  const batchSize = 1000

  const queryConditions = []
  if (eventTypes != null) {
    queryConditions.push(`${escapeId('type')} IN (${eventTypes.map(injectString)})`)
  }
  if (aggregateIds != null) {
    queryConditions.push(
      `${escapeId('aggregateId')} IN (${aggregateIds.map(injectString)})`
    )
  }
  if (startTime != null) {
    queryConditions.push(`${escapeId('timestamp')} > ${injectNumber(startTime)}`)
  }
  if (finishTime != null) {
    queryConditions.push(`${escapeId('timestamp')} < ${injectNumber(finishTime)}`)
  }

  const resultQueryCondition =
    queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : ''

  for(let skipCount = 0; ; skipCount++) {
    const rows = await database.all(
      `SELECT * FROM ${escapeId(tableName)} ${resultQueryCondition}
      ORDER BY ${escapeId('timestamp')} ASC,
      ${escapeId('aggregateVersion')} ASC
      LIMIT ${+(skipCount * batchSize)}, ${+batchSize}`
    )

    for(const event of rows) {
      await callback(event)
    }

    if(rows.length < batchSize) {
      break
    }
  }
}

export default loadEvents
