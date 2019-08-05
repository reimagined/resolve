const getLatestEvent = async (
  { executeSql, escapeId, escapeUnicode, tableName },
  { eventTypes, aggregateIds, startTime, finishTime }
) => {
  const injectString = value => `${escapeUnicode(value)}`
  const injectNumber = value => `${+value}`

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

  const rows = await executeSql(
    `SELECT * FROM ${escapeId(tableName)} ${resultQueryCondition}
    ORDER BY ${escapeId('eventId')} DESC LIMIT 0, 1`
  )

  if (rows.length === 0) {
    return null
  }

  return {
    ...rows[0],
    payload: JSON.parse(rows[0].payload)
  }
}

export default getLatestEvent
