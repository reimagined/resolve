import {
  EventsWithCursor,
  CursorFilter,
  SavedEvent,
  cursorToThreadArray,
  threadArrayToCursor,
  emptyLoadEventsResult,
} from '@resolve-js/eventstore-base'
import { AdapterPool } from './types'

const loadEventsByCursor = async (
  {
    executeStatement,
    escapeId,
    escape,
    eventsTableName,
    shapeEvent,
  }: AdapterPool,
  filter: CursorFilter
): Promise<EventsWithCursor> => {
  const { eventTypes, aggregateIds, cursor, limit } = filter
  const injectString = (value: any): string => `${escape(value)}`

  const vectorConditions = cursorToThreadArray(cursor)

  const queryConditions = []
  if (eventTypes != null) {
    if (eventTypes.length === 0) {
      return emptyLoadEventsResult(cursor)
    }
    queryConditions.push(
      `${escapeId('type')} IN (${eventTypes.map(injectString).join(', ')})`
    )
  }
  if (aggregateIds != null) {
    if (aggregateIds.length === 0) {
      return emptyLoadEventsResult(cursor)
    }
    queryConditions.push(
      `${escapeId('aggregateId')} IN (${aggregateIds
        .map(injectString)
        .join(', ')})`
    )
  }

  const resultQueryCondition = `WHERE ${
    queryConditions.length > 0 ? `${queryConditions.join(' AND ')} AND (` : ''
  }
    ${vectorConditions
      .map(
        (threadCounter, threadId) =>
          `${escapeId('threadId')} = ${+threadId} AND ${escapeId(
            'threadCounter'
          )} >= ${+threadCounter} `
      )
      .join(' OR ')}
    ${queryConditions.length > 0 ? ')' : ''}`

  const tableNameAsId = escapeId(eventsTableName)
  const events: SavedEvent[] = []

  const rows = await executeStatement(
    `SELECT * FROM ${tableNameAsId}
    ${resultQueryCondition}
    ORDER BY "timestamp" ASC, "threadCounter" ASC, "threadId" ASC
    LIMIT 0, ${+limit}`
  )

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
