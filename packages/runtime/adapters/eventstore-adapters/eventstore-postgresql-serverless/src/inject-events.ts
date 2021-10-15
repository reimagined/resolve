import { RESERVED_EVENT_SIZE } from './constants'
import { AdapterPool } from './types'
import { StoredEvent } from '@resolve-js/eventstore-base'
import { THREAD_COUNT } from '@resolve-js/eventstore-base'

const injectEvents = async function (
  pool: AdapterPool,
  events: StoredEvent[]
): Promise<void> {
  if (events.length === 0) {
    return
  }

  const threadCounters = new Array<StoredEvent['threadCounter']>(THREAD_COUNT)
  threadCounters.fill(0)

  for (const event of events) {
    const missingFields = []
    if (event.threadId == null) {
      missingFields.push(`"threadId"`)
    }
    if (event.threadCounter == null) {
      missingFields.push(`"threadCounter"`)
    }
    if (event.timestamp == null) {
      missingFields.push(`"timestamp"`)
    }
    if (missingFields.length > 0) {
      throw new Error(
        `The field ${missingFields.join(', ')} is required in ${JSON.stringify(
          event
        )}`
      )
    }

    const threadId = +event.threadId
    const threadCounter = +event.threadCounter

    if (threadId >= THREAD_COUNT || threadId < 0) {
      throw new Error(
        `threadId (${threadId}) must be positive number not greater than ${THREAD_COUNT}`
      )
    }

    threadCounters[threadId] = Math.max(
      threadCounter + 1,
      threadCounters[threadId]
    )
  }

  const {
    databaseName,
    eventsTableName,
    executeStatement,
    escapeId,
    escape,
  } = pool

  const databaseNameAsId = escapeId(databaseName)
  const threadsTableAsId = escapeId(`${eventsTableName}-threads`)
  const eventsTableAsId = escapeId(eventsTableName)

  await executeStatement(`
    WITH "update_thread_table" AS (
    UPDATE ${databaseNameAsId}.${threadsTableAsId}
    SET "threadCounter" = CASE ${threadCounters
      .map(
        (threadCounter, threadId) =>
          `WHEN "threadId" = ${threadId} AND "threadCounter" < ${threadCounter} THEN ${threadCounter}`
      )
      .join(' ')} ELSE "threadCounter" END)
    INSERT INTO ${databaseNameAsId}.${eventsTableAsId}(
    "threadId",
    "threadCounter",
    "timestamp",
    "aggregateId",
    "aggregateVersion",
    "type",
    "payload",
    "eventSize"
    ) VALUES ${events
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
  `)
}

export default injectEvents
