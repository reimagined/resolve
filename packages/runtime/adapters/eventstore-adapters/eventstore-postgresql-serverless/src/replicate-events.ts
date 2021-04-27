import { AdapterPool } from './types'
import { OldEvent, SavedEvent } from '@resolve-js/eventstore-base'
import { str as strCRC32 } from 'crc-32'
import { RESERVED_EVENT_SIZE } from './constants'

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
  const databaseNameAsId = escapeId(databaseName)

  const rows = (await executeStatement(
    `SELECT "threadId", MAX("threadCounter") AS "threadCounter" FROM 
    ${databaseNameAsId}.${eventsTableNameAsId} GROUP BY "threadId" ORDER BY "threadId" ASC`
  )) as Array<{
    threadId: SavedEvent['threadId']
    threadCounter: SavedEvent['threadCounter']
  }>

  const threadCounters = new Array<number>(256)
  for (const row of rows) {
    threadCounters[row.threadId] = row.threadCounter
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

  if (eventsToInsert.length) {
    await executeStatement(`INSERT INTO ${databaseNameAsId}.${eventsTableNameAsId}(
      "threadId",
      "threadCounter",
      "timestamp",
      "aggregateId",
      "aggregateVersion",
      "type",
      "payload",
      "eventSize"
    ) VALUES ${eventsToInsert
      .map((event) => {
        const serializedEvent = [
          `${escape(event.aggregateId)},`,
          `${+event.aggregateVersion},`,
          `${escape(event.type)},`,
          escape(JSON.stringify(event.payload != null ? event.payload : null)),
        ].join('')

        const byteLength =
          Buffer.byteLength(serializedEvent) + RESERVED_EVENT_SIZE

        return `(
      ${+event.threadId},
      ${+event.threadCounter},
      ${+event.timestamp},
      ${serializedEvent},
      ${byteLength}
    )`
      })
      .join(',')}
      ON CONFLICT DO NOTHING`)
  }
}

export default replicateEvents
