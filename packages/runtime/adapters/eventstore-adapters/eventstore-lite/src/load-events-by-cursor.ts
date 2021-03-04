import { EventsWithCursor, CursorFilter } from '@resolve-js/eventstore-base'
import { AdapterPool } from './types'

const split2RegExp = /.{1,2}(?=(.{2})+(?!.))|.{1,2}$/g

const loadEventsByCursor = async (
  { database, escapeId, escape, eventsTableName, shapeEvent }: AdapterPool,
  filter: CursorFilter
): Promise<EventsWithCursor> => {
  const { eventTypes, aggregateIds, cursor, limit } = filter
  const injectString = (value: any): string => `${escape(value)}`
  const injectNumber = (value: any): string => `${+value}`

  const cursorBuffer: Buffer =
    cursor != null ? Buffer.from(cursor, 'base64') : Buffer.alloc(1536, 0)
  const vectorConditions = []
  for (let i = 0; i < cursorBuffer.length / 6; i++) {
    vectorConditions.push(
      `0x${cursorBuffer.slice(i * 6, (i + 1) * 6).toString('hex')}`
    )
  }

  const queryConditions = []
  if (eventTypes != null) {
    queryConditions.push(
      `${escapeId('type')} IN (${eventTypes.map(injectString).join(', ')})`
    )
  }
  if (aggregateIds != null) {
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
          `${escapeId('threadId')} = ${injectNumber(threadId)} AND ${escapeId(
            'threadCounter'
          )} >= ${threadCounter} `
      )
      .join(' OR ')}
    ${queryConditions.length > 0 ? ')' : ''}`

  const tableNameAsId = escapeId(eventsTableName)
  const events: any[] = []

  const rows = await database.all(
    `SELECT * FROM ${tableNameAsId}
    ${resultQueryCondition}
    ORDER BY "timestamp" ASC, "threadCounter" ASC, "threadId" ASC
    LIMIT 0, ${+limit}`
  )

  for (const event of rows) {
    const threadId = +event.threadId
    const threadCounter = +event.threadCounter
    const oldThreadCounter = parseInt(
      vectorConditions[threadId].substring(2),
      16
    )

    vectorConditions[threadId] = `0x${Math.max(
      threadCounter + 1,
      oldThreadCounter
    )
      .toString(16)
      .padStart(12, '0')}`

    events.push(shapeEvent(event))
  }

  const nextConditionsBuffer = Buffer.alloc(1536)
  let byteIndex = 0

  for (const threadCounter of vectorConditions) {
    const threadCounterBytes = threadCounter.substring(2).match(split2RegExp)
    if (Array.isArray(threadCounterBytes)) {
      for (const byteHex of threadCounterBytes) {
        nextConditionsBuffer[byteIndex++] = Buffer.from(byteHex, 'hex')[0]
      }
    }
  }

  return {
    cursor: nextConditionsBuffer.toString('base64'),
    events,
  }
}

export default loadEventsByCursor
