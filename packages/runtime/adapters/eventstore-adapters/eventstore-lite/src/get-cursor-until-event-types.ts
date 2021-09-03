import { AdapterPool } from './types'
import {
  cursorToThreadArray,
  SavedEvent,
  threadArrayToCursor,
  initThreadArray,
  Cursor,
} from '@resolve-js/eventstore-base'

const getCursorUntilEventTypes = async (
  {
    executeStatement,
    escapeId,
    escape,
    eventsTableName,
    shapeEvent,
  }: AdapterPool,
  cursor: Cursor,
  untilEventTypes: Array<SavedEvent['type']>
): Promise<string> => {
  if (untilEventTypes.length < 1) {
    throw new Error('Must define at least one event type')
  }

  const tableNameAsId = escapeId(eventsTableName)

  const vectorConditions = cursorToThreadArray(cursor)

  const minThreadCounterConditions = `${vectorConditions
    .map(
      (threadCounter, threadId) =>
        `${escapeId('threadId')} = ${+threadId} AND ${escapeId(
          'threadCounter'
        )} >= ${+threadCounter} `
    )
    .join(' OR ')}`

  const rows = (await executeStatement(
    `SELECT "threadId", MIN("threadCounter") AS "threadCounter" FROM (
          SELECT "threadId", MIN("threadCounter") AS "threadCounter" FROM ${tableNameAsId} WHERE type IN 
          (${untilEventTypes.map((t) => escape(t)).join(', ')}) 
          AND (${minThreadCounterConditions}) 
          GROUP BY "threadId"
          UNION ALL
          SELECT "threadId", MAX("threadCounter")+1 AS "threadCounter" FROM ${tableNameAsId} GROUP BY "threadId")
        GROUP BY "threadId"`
  )) as Array<{
    threadId: SavedEvent['threadId']
    threadCounter: SavedEvent['threadCounter']
  }>

  const threadCounters = initThreadArray()
  for (const row of rows) {
    threadCounters[row.threadId] = +row.threadCounter
  }
  return threadArrayToCursor(threadCounters)
}

export default getCursorUntilEventTypes
