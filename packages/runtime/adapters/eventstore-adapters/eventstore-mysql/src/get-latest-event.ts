import { StoredEvent, LatestEventFilter } from '@resolve-js/eventstore-base'
import type { AdapterPool } from './types'

const getLatestEvent = async (
  {
    connection,
    eventsTableName,
    escapeId,
    escape,
    shapeEvent,
    query,
  }: AdapterPool,
  filter: LatestEventFilter
): Promise<StoredEvent | null> => {
  const { eventTypes, aggregateIds } = filter

  const injectString = (value: any): string => `${escape(value)}`

  const queryConditions: any[] = []
  if (eventTypes != null) {
    queryConditions.push(`\`type\` IN (${eventTypes.map(injectString)})`)
  }
  if (aggregateIds != null) {
    queryConditions.push(
      `\`aggregateId\` IN (${aggregateIds.map(injectString)})`
    )
  }

  const resultQueryCondition =
    queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : ''

  const eventsTableNameAsId: string = escapeId(eventsTableName)

  const [rows] = await query(
    `SELECT * FROM ${eventsTableNameAsId} ${resultQueryCondition}
    ORDER BY \`timestamp\` DESC, \`aggregateVersion\` DESC`
  )

  if (rows.length === 0) {
    return null
  }

  return shapeEvent(rows[0])
}

export default getLatestEvent
