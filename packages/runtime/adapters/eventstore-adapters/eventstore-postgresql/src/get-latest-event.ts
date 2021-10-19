import type { AdapterPool } from './types'
import type {
  LatestEventFilter,
  EventFilter,
  StoredEvent,
} from '@resolve-js/eventstore-base'
import { isTimestampFilter } from '@resolve-js/eventstore-base'

const getLatestEvent = async (
  {
    executeStatement,
    escapeId,
    escape,
    eventsTableName,
    databaseName,
    shapeEvent,
  }: AdapterPool,
  filter: LatestEventFilter
): Promise<StoredEvent | null> => {
  const { eventTypes, aggregateIds } = filter

  const injectString = (value: any): string => `${escape(value)}`
  const injectNumber = (value: any): string => `${+value}`

  const databaseNameAsId = escapeId(databaseName)
  const eventsTableNameAsId = escapeId(eventsTableName)

  const queryConditions = []
  if (eventTypes != null) {
    if (eventTypes.length === 0) {
      return null
    }
    queryConditions.push(`"type" IN (${eventTypes.map(injectString)})`)
  }
  if (aggregateIds != null) {
    if (aggregateIds.length === 0) {
      return null
    }
    queryConditions.push(`"aggregateId" IN (${aggregateIds.map(injectString)})`)
  }
  if (isTimestampFilter(filter as EventFilter)) {
    const { startTime, finishTime } = filter
    if (startTime != null) {
      queryConditions.push(`"timestamp" > ${injectNumber(startTime)}`)
    }
    if (finishTime != null) {
      queryConditions.push(`"timestamp" < ${injectNumber(finishTime)}`)
    }
  }

  const resultQueryCondition =
    queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : ''

  const rows = await executeStatement(
    `SELECT * FROM ${databaseNameAsId}.${eventsTableNameAsId}
    ${resultQueryCondition}
    ORDER BY "timestamp" DESC
    OFFSET 0
    LIMIT 1`
  )

  if (rows.length === 0) {
    return null
  }

  return shapeEvent(rows[0])
}

export default getLatestEvent
