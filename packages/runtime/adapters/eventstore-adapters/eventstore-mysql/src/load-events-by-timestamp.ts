import {
  TimestampFilter,
  EventsWithCursor,
  throwBadCursor,
} from '@resolve-js/eventstore-base'
import { AdapterPool } from './types'

const loadEventsByTimestamp = async (
  { connection, eventsTableName, escapeId, escape, shapeEvent }: AdapterPool,
  { eventTypes, aggregateIds, startTime, finishTime, limit }: TimestampFilter
): Promise<EventsWithCursor> => {
  const injectString = (value: any): string => `${escape(value)}`
  const injectNumber = (value: any): string => `${+value}`

  const queryConditions: any[] = []
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

  const resultQueryCondition: string =
    queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : ''

  const eventsTableNameAsId: string = escapeId(eventsTableName)

  const [rows] = await connection.query(
    `SELECT * FROM ${eventsTableNameAsId}
    ${resultQueryCondition}
    ORDER BY \`timestamp\` ASC,
    \`threadCounter\` ASC,
    \`threadId\` ASC
    LIMIT 0, ${+limit}`
  )

  for (const event of rows) {
    events.push(shapeEvent(event))
  }

  return {
    get cursor() {
      return throwBadCursor() as any
    },
    events,
  }
}

export default loadEventsByTimestamp
