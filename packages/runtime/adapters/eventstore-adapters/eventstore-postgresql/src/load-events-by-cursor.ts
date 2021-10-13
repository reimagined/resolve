import { INT8_SQL_TYPE } from './constants'
import { AdapterPool } from './types'
import {
  CursorFilter,
  StoredEvent,
  StoredEventBatchPointer,
  cursorToThreadArray,
  threadArrayToCursor,
  emptyLoadEventsResult,
} from '@resolve-js/eventstore-base'

const loadEventsByCursor = async (
  {
    executeStatement,
    escapeId,
    escape,
    eventsTableName,
    databaseName,
    shapeEvent,
  }: AdapterPool,
  { eventTypes, aggregateIds, cursor, limit }: CursorFilter
): Promise<StoredEventBatchPointer> => {
  const injectString = (value: any): string => `${escape(value)}`
  const injectNumber = (value: any): string => `${+value}`

  const vectorConditions = cursorToThreadArray(cursor)

  const queryConditions: string[] = []
  if (eventTypes != null) {
    if (eventTypes.length === 0) {
      return emptyLoadEventsResult(cursor)
    }
    queryConditions.push(`"type" IN (${eventTypes.map(injectString)})`)
  }
  if (aggregateIds != null) {
    if (aggregateIds.length === 0) {
      return emptyLoadEventsResult(cursor)
    }
    queryConditions.push(`"aggregateId" IN (${aggregateIds.map(injectString)})`)
  }

  const resultQueryCondition = `WHERE ${
    queryConditions.length > 0 ? `${queryConditions.join(' AND ')} AND (` : ''
  }
    ${vectorConditions
      .map(
        (threadCounter, threadId) =>
          `"threadId" = ${injectNumber(
            threadId
          )} AND "threadCounter" >= ${threadCounter}::${INT8_SQL_TYPE} `
      )
      .join(' OR ')}
    ${queryConditions.length > 0 ? ')' : ''}`

  const databaseNameAsId: string = escapeId(databaseName)
  const eventsTableAsId: string = escapeId(eventsTableName)

  const sqlQuery = [
    `SELECT * FROM ${databaseNameAsId}.${eventsTableAsId}`,
    `${resultQueryCondition}`,
    `ORDER BY "timestamp" ASC, "threadCounter" ASC, "threadId" ASC`,
    `LIMIT ${+limit}`,
  ].join('\n')

  const rows: any[] = await executeStatement(sqlQuery)
  const events: StoredEvent[] = []

  for (const event of rows) {
    const threadId = +event.threadId
    const threadCounter = +event.threadCounter
    const oldThreadCounter = vectorConditions[threadId]
    vectorConditions[threadId] = Math.max(threadCounter + 1, oldThreadCounter)

    events.push(shapeEvent(event))
  }

  const nextConditions = threadArrayToCursor(vectorConditions)

  return {
    cursor: nextConditions,
    events,
  }
}

export default loadEventsByCursor
