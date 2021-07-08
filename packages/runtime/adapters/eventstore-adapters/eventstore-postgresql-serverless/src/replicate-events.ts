import type { AdapterPool } from './types'
import { THREAD_COUNT } from '@resolve-js/eventstore-base'
import type { OldEvent, SavedEvent } from '@resolve-js/eventstore-base'
import { str as strCRC32 } from 'crc-32'
import { RESERVED_EVENT_SIZE } from './constants'

const MAX_EVENTS_BATCH_BYTE_SIZE = 32768

type EventWithSize = {
  event: SavedEvent
  size: number
  serialized: string
}

export const replicateEvents = async (
  pool: AdapterPool,
  events: OldEvent[]
): Promise<void> => {
  if (events.length === 0) return

  const {
    executeStatement,
    eventsTableName,
    escape,
    escapeId,
    databaseName,
  } = pool
  const eventsTableNameAsId = escapeId(eventsTableName)
  const threadsTableAsId = escapeId(`${eventsTableName}-threads`)
  const databaseNameAsId = escapeId(databaseName)

  const rows = (await executeStatement(
    `SELECT "threadId", MAX("threadCounter") AS "threadCounter" FROM 
    ${databaseNameAsId}.${eventsTableNameAsId} GROUP BY "threadId" ORDER BY "threadId" ASC`
  )) as Array<{
    threadId: SavedEvent['threadId']
    threadCounter: SavedEvent['threadCounter']
  }>

  const threadCounters = new Array<SavedEvent['threadCounter']>(THREAD_COUNT)
  for (const row of rows) {
    threadCounters[row.threadId] = +row.threadCounter
  }

  const eventsToInsert: SavedEvent[] = []

  for (const event of events) {
    const threadId =
      Math.abs(strCRC32(event.aggregateId + event.aggregateVersion)) %
      threadCounters.length
    const threadCounter =
      threadCounters[threadId] === undefined ? 0 : threadCounters[threadId] + 1
    threadCounters[threadId] = threadCounter

    eventsToInsert.push({ ...event, threadId, threadCounter })
  }

  if (eventsToInsert.length === 0) return

  const calculateEventWithSize = (event: SavedEvent): EventWithSize => {
    const serializedEvent = [
      `${escape(event.aggregateId)},`,
      `${+event.aggregateVersion},`,
      `${escape(event.type)},`,
      escape(JSON.stringify(event.payload != null ? event.payload : null)),
    ].join('')

    const byteLength = Buffer.byteLength(serializedEvent) + RESERVED_EVENT_SIZE

    return {
      event,
      size: byteLength,
      serialized: serializedEvent,
    }
  }

  const insertEventsBatch = async (
    eventsWithSize: EventWithSize[]
  ): Promise<void> => {
    let shouldRetry = false
    do {
      shouldRetry = false
      try {
        await executeStatement(`INSERT INTO ${databaseNameAsId}.${eventsTableNameAsId}(
    "threadId",
    "threadCounter",
    "timestamp",
    "aggregateId",
    "aggregateVersion",
    "type",
    "payload",
    "eventSize"
  ) VALUES ${eventsWithSize
    .map(
      (eventWithSize) =>
        `(${eventWithSize.event.threadId},
          ${eventWithSize.event.threadCounter},
          ${eventWithSize.event.timestamp},
          ${eventWithSize.serialized},
          ${eventWithSize.size})`
    )
    .join(',')}
    ON CONFLICT DO NOTHING`)
      } catch (error) {
        const errorMessage: string = error.message
        if (/deadlock detected/.test(errorMessage)) {
          shouldRetry = true
        } else {
          throw error
        }
      }
    } while (shouldRetry)
  }

  const eventPromises: Array<Promise<void>> = []

  let currentBatchSize = 0
  const currentEventsBatch: EventWithSize[] = []

  for (const event of eventsToInsert) {
    const eventWithSize = calculateEventWithSize(event)

    if (eventWithSize.size > MAX_EVENTS_BATCH_BYTE_SIZE) {
      eventPromises.push(insertEventsBatch([eventWithSize]))
      continue
    }

    const newCurrentBatchSize = currentBatchSize + eventWithSize.size
    if (newCurrentBatchSize > MAX_EVENTS_BATCH_BYTE_SIZE) {
      eventPromises.push(insertEventsBatch(currentEventsBatch))
      currentEventsBatch.length = 0
      currentBatchSize = 0
    }
    currentBatchSize += eventWithSize.size
    currentEventsBatch.push(eventWithSize)
  }

  if (currentEventsBatch.length) {
    eventPromises.push(insertEventsBatch(currentEventsBatch))
  }

  await Promise.all(eventPromises)

  type ThreadToUpdate = {
    threadId: SavedEvent['threadId']
    threadCounter: SavedEvent['threadCounter']
  }
  const threadsToUpdate: ThreadToUpdate[] = []
  for (let i = 0; i < threadCounters.length; ++i) {
    if (threadCounters[i] !== undefined) {
      threadsToUpdate.push({
        threadId: i,
        threadCounter: threadCounters[i] + 1,
      })
    }
  }
  if (threadsToUpdate.length > 0) {
    await executeStatement(`INSERT INTO ${databaseNameAsId}.${threadsTableAsId} ("threadId","threadCounter") 
    VALUES ${threadsToUpdate
      .map(
        (threadToUpdate) =>
          `(${threadToUpdate.threadId},${threadToUpdate.threadCounter})`
      )
      .join(
        ','
      )} ON CONFLICT ("threadId") DO UPDATE SET "threadCounter" = EXCLUDED."threadCounter"`)
  }
}

export default replicateEvents
