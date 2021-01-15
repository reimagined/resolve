import { AdapterPool } from './types'
import { EventFilter } from 'resolve-eventstore-base'

const getLatestEvent = async (
  {
    executeStatement,
    escapeId,
    escape,
    eventsTableName,
    databaseName,
    shapeEvent,
  }: AdapterPool,
  { eventTypes, aggregateIds, startTime, finishTime }: EventFilter
): Promise<any> => {
  const injectString = (value: any): string => `${escape(value)}`
  const injectNumber = (value: any): string => `${+value}`

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
