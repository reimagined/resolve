const loadEventsByTimestamp = async (
  { connection, escapeId, escape, tableName, shapeEvent },
  { eventTypes, aggregateIds, startTime, finishTime, limit },
  callback
) => {
  const injectString = value => `${escape(value)}`
  const injectNumber = value => `${+value}`
  const batchSize = limit != null ? Math.min(limit, 0x7fffffff) : 0x7fffffff

  const queryConditions = []
  if (eventTypes != null) {
    queryConditions.push(`\`type\` IN (${eventTypes.map(injectString)})`)
  }
  if (aggregateIds != null) {
    queryConditions.push(
      `\`aggregateId\` IN (${aggregateIds.map(injectString)})`
    )
  }
  if (startTime != null) {
    queryConditions.push(`\`timestamp\` > ${injectNumber(startTime)}`)
  }
  if (finishTime != null) {
    queryConditions.push(`\`timestamp\` < ${injectNumber(finishTime)}`)
  }

  const resultQueryCondition =
    queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : ''

  const eventsTableNameAsId = escapeId(tableName)

  const [rows] = await connection.query(
    `SELECT * FROM ${eventsTableNameAsId}
    ${resultQueryCondition}
    ORDER BY \`timestamp\` ASC,
    \`threadCounter\` ASC
    LIMIT 0, ${+batchSize}`
  )

  for (const event of rows) {
    await callback(shapeEvent(event))
  }
}

export default loadEventsByTimestamp
