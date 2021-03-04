import { AdapterPool } from './types'
import {
  EventFilter,
  isTimestampFilter,
  SavedEvent,
} from '@resolve-js/eventstore-base'

const getLatestEvent = async (
  {
    executeStatement,
    escapeId,
    escape,
    eventsTableName,
    databaseName,
    shapeEvent,
    isTimeoutError,
  }: AdapterPool,
  filter: EventFilter
): Promise<SavedEvent | null> => {
  const { eventTypes, aggregateIds } = filter

  const injectString = (value: any): string => `${escape(value)}`
  const injectNumber = (value: any): string => `${+value}`

  const databaseNameAsId: string = escapeId(databaseName)
  const eventsTableNameAsId: string = escapeId(eventsTableName)

  const queryConditions: any[] = []
  if (eventTypes != null) {
    queryConditions.push(`"type" IN (${eventTypes.map(injectString)})`)
  }
  if (aggregateIds != null) {
    queryConditions.push(`"aggregateId" IN (${aggregateIds.map(injectString)})`)
  }
  if (isTimestampFilter(filter)) {
    const { startTime, finishTime } = filter
    if (startTime != null) {
      queryConditions.push(`"timestamp" > ${injectNumber(startTime)}`)
    }
    if (finishTime != null) {
      queryConditions.push(`"timestamp" < ${injectNumber(finishTime)}`)
    }
  }

  const resultQueryCondition: string =
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
      if (isTimeoutError(err)) {
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
