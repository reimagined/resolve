import {
  EventFilter,
  isTimestampFilter,
  SavedEvent,
} from '@resolve-js/eventstore-base'
import { AdapterPool } from './types'

const getLatestEvent = async (
  { connection, eventsTableName, escapeId, escape, shapeEvent }: AdapterPool,
  filter: EventFilter
): Promise<SavedEvent | null> => {
  const { eventTypes, aggregateIds } = filter

  const injectString = (value: any): string => `${escape(value)}`
  const injectNumber = (value: any): string => `${+value}`

  const queryConditions: any[] = []
  if (eventTypes != null) {
    queryConditions.push(`\`type\` IN (${eventTypes.map(injectString)})`)
  }
  if (aggregateIds != null) {
    queryConditions.push(
      `\`aggregateId\` IN (${aggregateIds.map(injectString)})`
    )
  }
  if (isTimestampFilter(filter)) {
    const { startTime, finishTime } = filter
    if (startTime != null) {
      queryConditions.push(`\`timestamp\` > ${injectNumber(startTime)}`)
    }
    if (finishTime != null) {
      queryConditions.push(`\`timestamp\` < ${injectNumber(finishTime)}`)
    }
  }

  const resultQueryCondition =
    queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : ''

  const eventsTableNameAsId: string = escapeId(eventsTableName)

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
