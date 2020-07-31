const getLatestEvent = async (
  {
    executeStatement,
    escapeId,
    escape,
    eventsTableName,
    databaseName,
    shapeEvent
  },
  { eventTypes, aggregateIds, startTime, finishTime }
) => {
  const injectString = value => `${escape(value)}`
  const injectNumber = value => `${+value}`

  const databaseNameAsId = escapeId(databaseName)
  const eventsTableNameAsId = escapeId(eventsTableName)

  const queryConditions = []
  if (eventTypes != null) {
    queryConditions.push(`"type" IN (${eventTypes.map(injectString)})`)
  }
  if (aggregateIds != null) {
    queryConditions.push(`"aggregateId" IN (${aggregateIds.map(injectString)})`)
  }
  if (startTime != null) {
    queryConditions.push(`"timestamp" > ${injectNumber(startTime)}`)
  }
  if (finishTime != null) {
    queryConditions.push(`"timestamp" < ${injectNumber(finishTime)}`)
  }

  const resultQueryCondition =
    queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : ''

  let rows = null

  while (true) {
    try {
      rows = await executeStatement(
        `SELECT * FROM ${databaseNameAsId}.${eventsTableNameAsId}
        ${resultQueryCondition}
        ORDER BY "timestamp" DESC
        OFFSET 0
        LIMIT 1`
      )
      break
    } catch (err) {
      if (err != null && /StatementTimeoutException/i.test(err.message)) {
        continue
      }
      throw err
    }
  }

  if (rows.length === 0) {
    return null
  }

  return shapeEvent(rows[0])
}

export default getLatestEvent
