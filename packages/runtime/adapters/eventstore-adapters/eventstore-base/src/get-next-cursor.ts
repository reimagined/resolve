import type { EventThreadData } from './types'
import { cursorToThreadArray, threadArrayToCursor } from './cursor-operations'

//const split2RegExp = /.{1,2}(?=(.{2})+(?!.))|.{1,2}$/g

const getNextCursor = (
  prevCursor: string | null,
  events: EventThreadData[]
): string => {
  const vectorConditions = cursorToThreadArray(prevCursor)

  for (const event of events) {
    const { threadId, threadCounter } = event
    const oldThreadCounter = vectorConditions[threadId]

    vectorConditions[threadId] = Math.max(threadCounter + 1, oldThreadCounter)
  }

  return threadArrayToCursor(vectorConditions)
}

export default getNextCursor
