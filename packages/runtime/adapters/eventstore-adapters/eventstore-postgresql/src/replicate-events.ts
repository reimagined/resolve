import type { AdapterPool } from './types'
import { THREAD_COUNT } from '@resolve-js/eventstore-base'
import type { OldEvent, StoredEvent } from '@resolve-js/eventstore-base'
import { str as strCRC32 } from 'crc-32'
import { RESERVED_EVENT_SIZE } from './constants'
import assert from 'assert'

const MAX_EVENTS_BATCH_BYTE_SIZE = 1024 * 1024 * 10

type EventWithSize = {
  event: StoredEvent
  size: number
  serialized: string
}

export const replicateEvents = async (
  pool: AdapterPool,
  lockId: string,
  events: OldEvent[]
): Promise<boolean> => {
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
  const replicationStateTableNameAsId = escapeId(
    `${eventsTableName}-replication-state`
  )

  const stringRows = (await executeStatement(
    `SELECT "threadId", MAX("threadCounter") AS "threadCounter" FROM 
    ${databaseNameAsId}.${eventsTableNameAsId} GROUP BY "threadId" ORDER BY "threadId" ASC`
  )) as Array<{
    threadId: string
    threadCounter: string
  }>
  const rows = stringRows.map((row) => {
    const result = {
      threadId: +row.threadId,
      threadCounter: +row.threadCounter,
    }
    assert.strict.ok(!Number.isNaN(result.threadId))
    assert.strict.ok(!Number.isNaN(result.threadCounter))

    return result
  })

  const threadCounters = new Array<StoredEvent['threadCounter']>(THREAD_COUNT)
  for (const row of rows) {
    threadCounters[row.threadId] = +row.threadCounter
  }

  const eventsToInsert: StoredEvent[] = []

  for (const event of events) {
    const threadId =
      Math.abs(strCRC32(event.aggregateId + event.aggregateVersion)) %
      threadCounters.length
    const threadCounter =
      threadCounters[threadId] === undefined ? 0 : threadCounters[threadId] + 1
    threadCounters[threadId] = threadCounter

    eventsToInsert.push({ ...event, threadId, threadCounter })
  }

  const calculateEventWithSize = (event: StoredEvent): EventWithSize => {
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
        await executeStatement(`BEGIN WORK;
        LOCK TABLE ${databaseNameAsId}.${replicationStateTableNameAsId} IN EXCLUSIVE MODE NOWAIT;
        WITH "lock_check" AS (
          SELECT 0 AS "lock_zero" WHERE (
            (SELECT 1 AS "ReplicationIsLocked")
          UNION ALL
            (SELECT 1 AS "ReplicationIsLocked"
            FROM ${databaseNameAsId}.${replicationStateTableNameAsId}
            WHERE "LockId" != ${escape(lockId)})
          ) = 1
        )
        INSERT INTO ${databaseNameAsId}.${eventsTableNameAsId}(
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
          ${eventWithSize.event.threadCounter} + (SELECT "lock_zero" FROM "lock_check" LIMIT 1),
          ${eventWithSize.event.timestamp},
          ${eventWithSize.serialized},
          ${eventWithSize.size})`
    )
    .join(',')}
    ON CONFLICT DO NOTHING;
    COMMIT WORK;`)
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

  let currentBatchSize = 0
  const currentEventsBatch: EventWithSize[] = []

  try {
    for (const event of eventsToInsert) {
      const eventWithSize = calculateEventWithSize(event)

      if (eventWithSize.size > MAX_EVENTS_BATCH_BYTE_SIZE) {
        await insertEventsBatch([eventWithSize])
        continue
      }

      const newCurrentBatchSize = currentBatchSize + eventWithSize.size
      if (newCurrentBatchSize > MAX_EVENTS_BATCH_BYTE_SIZE) {
        await insertEventsBatch(currentEventsBatch)
        currentEventsBatch.length = 0
        currentBatchSize = 0
      }
      currentBatchSize += eventWithSize.size
      currentEventsBatch.push(eventWithSize)
    }

    if (currentEventsBatch.length) {
      await insertEventsBatch(currentEventsBatch)
    }

    type ThreadToUpdate = {
      threadId: StoredEvent['threadId']
      threadCounter: StoredEvent['threadCounter']
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
      await executeStatement(`BEGIN WORK;
        LOCK TABLE ${databaseNameAsId}.${replicationStateTableNameAsId} IN EXCLUSIVE MODE NOWAIT;
        WITH "lock_check" AS (
          SELECT 0 AS "lock_zero" WHERE (
            (SELECT 1 AS "ReplicationIsLocked")
          UNION ALL
            (SELECT 1 AS "ReplicationIsLocked"
            FROM ${databaseNameAsId}.${replicationStateTableNameAsId}
            WHERE "LockId" != ${escape(lockId)})
          ) = 1
        )
        INSERT INTO ${databaseNameAsId}.${threadsTableAsId} ("threadId","threadCounter") 
    VALUES ${threadsToUpdate
      .map(
        (threadToUpdate) =>
          `(${threadToUpdate.threadId},${threadToUpdate.threadCounter} + (SELECT "lock_zero" FROM "lock_check" LIMIT 1))`
      )
      .join(
        ','
      )} ON CONFLICT ("threadId") DO UPDATE SET "threadCounter" = EXCLUDED."threadCounter";
      COMMIT;`)
    }

    return true
  } catch (error) {
    try {
      await executeStatement('ROLLBACK;')
    } catch (rollbackError) {
      // ignore
    }

    const errorMessage =
      error != null && error.message != null ? error.message : ''
    if (errorMessage.indexOf('subquery used as an expression') > -1) {
      return false
    } else if (errorMessage.indexOf('could not obtain lock on relation') > -1) {
      return false
    } else {
      throw error
    }
  }
}

export default replicateEvents
