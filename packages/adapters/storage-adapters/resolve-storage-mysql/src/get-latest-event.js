const getLatestEvent = async (
  { connection, escapeId, escape, tableName, shapeEvent },
  { eventTypes, aggregateIds, startTime, finishTime }
) => {
  const injectString = value => `${escape(value)}`
  const injectNumber = value => `${+value}`

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
    `SELECT * FROM ${eventsTableNameAsId} ${resultQueryCondition}
    ORDER BY \`timestamp\` DESC, \`aggregateVersion\` DESC`
  )

  if (rows.length === 0) {
    return null
  }

  return shapeEvent(rows[0])
}

export default getLatestEvent
