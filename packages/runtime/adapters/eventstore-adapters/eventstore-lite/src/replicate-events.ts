import type { AdapterPool } from './types'
import { THREAD_COUNT } from '@resolve-js/eventstore-base'
import type { OldEvent, SavedEvent } from '@resolve-js/eventstore-base'
import { str as strCRC32 } from 'crc-32'

export const replicateEvents = async (
  pool: AdapterPool,
  events: OldEvent[]
): Promise<void> => {
  if (events.length === 0) return

  const { database, eventsTableName, escape, escapeId } = pool
  const eventsTableNameAsId = escapeId(eventsTableName)

  const rows = (await database.all(
    `SELECT "threadId", MAX("threadCounter") AS "threadCounter" FROM 
    ${eventsTableNameAsId} GROUP BY "threadId" ORDER BY "threadId" ASC`
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

  await database.exec(`INSERT OR IGNORE INTO ${eventsTableNameAsId}(
      "threadId",
      "threadCounter",
      "timestamp",
      "aggregateId",
      "aggregateVersion",
      "type",
      "payload"
    ) VALUES ${eventsToInsert
      .map(
        (event) => `(
      ${+event.threadId},
      ${+event.threadCounter},
      ${+event.timestamp},
      ${escape(event.aggregateId)},
      ${+event.aggregateVersion},
      ${escape(event.type)},
      json(CAST(${
        event.payload != null
          ? escape(JSON.stringify(event.payload))
          : escape('null')
      } AS BLOB))
    )`
      )
      .join(',')}`)
}

export default replicateEvents
