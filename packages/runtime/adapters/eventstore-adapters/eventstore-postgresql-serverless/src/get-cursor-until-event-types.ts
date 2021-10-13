import { INT8_SQL_TYPE } from './constants'
import { AdapterPool } from './types'
import {
  cursorToThreadArray,
  StoredEvent,
  threadArrayToCursor,
  initThreadArray,
  InputCursor,
} from '@resolve-js/eventstore-base'

const getCursorUntilEventTypes = async (
  {
    executeStatement,
    escapeId,
    escape,
    eventsTableName,
    shapeEvent,
    databaseName,
  }: AdapterPool,
  cursor: InputCursor,
  untilEventTypes: Array<StoredEvent['type']>
): Promise<string> => {
  if (untilEventTypes.length < 1) {
    throw new Error('Must define at least one event type')
  }

  const databaseNameAsId: string = escapeId(databaseName)
  const eventsTableAsId: string = escapeId(eventsTableName)
  const threadsTableAsId: string = escapeId(`${eventsTableName}-threads`)

  const vectorConditions = cursorToThreadArray(cursor)

  const minThreadCounterConditions = `${vectorConditions
    .map(
      (threadCounter, threadId) =>
        `${escapeId('threadId')} = ${+threadId} AND ${escapeId(
          'threadCounter'
        )} >= ${+threadCounter}::${INT8_SQL_TYPE} `
    )
    .join(' OR ')}`

  const rows = (await executeStatement(
    `SELECT "threadId", MIN("threadCounter") AS "threadCounter" FROM (
          SELECT "threadId", MIN("threadCounter") AS "threadCounter" FROM ${databaseNameAsId}.${eventsTableAsId} WHERE type IN 
          (${untilEventTypes.map((t) => escape(t)).join(', ')}) 
          AND (${minThreadCounterConditions}) 
          GROUP BY "threadId"
          UNION ALL
          SELECT "threadId", "threadCounter" FROM ${databaseNameAsId}.${threadsTableAsId}) AS "union_table"
        GROUP BY "threadId"`
  )) as Array<{
    threadId: StoredEvent['threadId']
    threadCounter: StoredEvent['threadCounter']
  }>

  const threadCounters = initThreadArray()
  for (const row of rows) {
    threadCounters[row.threadId] = +row.threadCounter
  }
  return threadArrayToCursor(threadCounters)
}

export default getCursorUntilEventTypes
