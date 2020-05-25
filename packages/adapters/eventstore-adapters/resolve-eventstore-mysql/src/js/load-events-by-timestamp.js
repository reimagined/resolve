import { throwBadCursor } from 'resolve-eventstore-base'

const loadEventsByTimestamp = async (
  { events: { connection, tableName }, escapeId, escape, shapeEvent },
  { eventTypes, aggregateIds, startTime, finishTime, limit }
) => {
  const injectString = value => `${escape(value)}`
  const injectNumber = value => `${+value}`

  const queryConditions = []
  const events = []
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
    LIMIT 0, ${+limit}`
  )

  for (const event of rows) {
    events.push(shapeEvent(event))
  }

  return {
    get cursor() {
      return throwBadCursor()
    },
    events
  }
}

export default loadEventsByTimestamp
