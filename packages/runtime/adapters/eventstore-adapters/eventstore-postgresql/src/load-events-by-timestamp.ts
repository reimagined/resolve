import {
  TimestampFilter,
  StoredEventBatchPointer,
  loadEventsByTimestampResult,
} from '@resolve-js/eventstore-base'
import { AdapterPool } from './types'

const loadEventsByTimestamp = async (
  {
    executeStatement,
    escapeId,
    escape,
    eventsTableName,
    databaseName,
    shapeEvent,
  }: AdapterPool,
  { eventTypes, aggregateIds, startTime, finishTime, limit }: TimestampFilter
): Promise<StoredEventBatchPointer> => {
  const injectString = (value: any): string => `${escape(value)}`
  const injectNumber = (value: any): string => `${+value}`

  const queryConditions: any[] = []
  const events: any[] = []
  if (eventTypes != null) {
    queryConditions.push(`"type" IN (${eventTypes.map(injectString)})`)
  }
  if (aggregateIds != null) {
    queryConditions.push(`"aggregateId" IN (${aggregateIds.map(injectString)})`)
  }
  if (startTime != null) {
    queryConditions.push(`"timestamp" >= ${injectNumber(startTime)}`)
  }
  if (finishTime != null) {
    queryConditions.push(`"timestamp" <= ${injectNumber(finishTime)}`)
  }

  const resultQueryCondition: string =
    queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : ''

  const databaseNameAsId = escapeId(databaseName)
  const eventsTableNameAsId = escapeId(eventsTableName)

  const sqlQuery = [
    `SELECT * FROM ${databaseNameAsId}.${eventsTableNameAsId}`,
    `${resultQueryCondition}`,
    `ORDER BY "timestamp" ASC, "threadCounter" ASC, "threadId" ASC`,
    `LIMIT ${+limit}`,
  ].join('\n')

  const rows = await executeStatement(sqlQuery)

  for (const event of rows) {
    events.push(shapeEvent(event))
  }

  return loadEventsByTimestampResult(events)
}

export default loadEventsByTimestamp
