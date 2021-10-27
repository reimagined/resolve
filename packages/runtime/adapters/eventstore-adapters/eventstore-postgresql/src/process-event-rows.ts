import type { AdapterPool } from './types'
import type {
  InputCursor,
  StoredEvent,
  StoredEventBatchPointer,
} from '@resolve-js/core'
import {
  cursorToThreadArray,
  threadArrayToCursor,
} from '@resolve-js/eventstore-base'

const processEventRows = (
  pool: AdapterPool,
  cursor: InputCursor,
  rows: any[]
): StoredEventBatchPointer => {
  const vectorConditions = cursorToThreadArray(cursor)
  const events: StoredEvent[] = []

  for (const event of rows) {
    const threadId = +event.threadId
    const threadCounter = +event.threadCounter
    const oldThreadCounter = vectorConditions[threadId]
    vectorConditions[threadId] = Math.max(threadCounter + 1, oldThreadCounter)

    events.push(pool.shapeEvent(event))
  }

  return {
    cursor: threadArrayToCursor(vectorConditions),
    events,
  }
}

export default processEventRows
