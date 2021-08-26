import {
  ConcurrentError,
  InputEvent,
  SavedEvent,
  EventThreadData,
  EventWithCursor,
  threadArrayToCursor,
  THREAD_COUNT,
} from '@resolve-js/eventstore-base'
import { AdapterPool } from './types'
import { EventstoreFrozenError } from '@resolve-js/eventstore-base'
import assert from 'assert'

const saveEvent = async (
  pool: AdapterPool,
  event: InputEvent
): Promise<EventWithCursor> => {
  const { eventsTableName, database, escapeId, escape } = pool
  try {
    const currentThreadId = Date.now() % THREAD_COUNT
    const eventsTableNameAsId = escapeId(eventsTableName)
    const freezeTableNameAsString = escape(`${eventsTableName}-freeze`)
    const serializedPayload =
      event.payload != null
        ? escape(JSON.stringify(event.payload))
        : escape('null')

    await database.exec(
      `BEGIN IMMEDIATE;

      SELECT ABS("CTE"."EventStoreIsFrozen") FROM (
        SELECT 0 AS "EventStoreIsFrozen"
      UNION ALL
        SELECT -9223372036854775808 AS "EventStoreIsFrozen"
        FROM "sqlite_master"
        WHERE "type" = 'table' AND 
        "name" = ${freezeTableNameAsString}
      ) CTE;

      INSERT INTO ${eventsTableNameAsId}(
        "threadId",
        "threadCounter",
        "timestamp",
        "aggregateId",
        "aggregateVersion",
        "type",
        "payload"
      ) VALUES(
        ${+currentThreadId},
        COALESCE(
          (
            SELECT MAX("threadCounter") FROM ${eventsTableNameAsId}
            WHERE "threadId" = ${+currentThreadId}
          ) + 1,
         0
        ),
        MAX(
          CAST(strftime('%s','now') || substr(strftime('%f','now'),4) AS INTEGER),
          ${+event.timestamp}
        ),
        ${escape(event.aggregateId)},
        ${+event.aggregateVersion},
        ${escape(event.type)},
        json(CAST(${serializedPayload} AS BLOB))
      );
      COMMIT;`
    )

    const rows = (await database.all(
      `SELECT "threadId", MAX("threadCounter") AS "threadCounter", "timestamp" FROM 
    ${eventsTableNameAsId} GROUP BY "threadId" ORDER BY "threadId" ASC`
    )) as Array<{
      threadId: EventThreadData['threadId']
      threadCounter: EventThreadData['threadCounter']
      timestamp: SavedEvent['timestamp']
    }>

    const threadCounters = new Array<number>(THREAD_COUNT)
    threadCounters.fill(-1)

    let savedEventThreadCounter: number | undefined
    let savedEventTimestamp: number | undefined

    for (const row of rows) {
      threadCounters[row.threadId] = row.threadCounter
      if (row.threadId === currentThreadId) {
        savedEventThreadCounter = row.threadCounter
        savedEventTimestamp = row.timestamp
      }
    }

    if (savedEventThreadCounter === undefined) {
      throw new assert.AssertionError({
        message: 'Could not find threadCounter of saved event',
        actual: savedEventThreadCounter,
        expected: undefined,
        operator: 'notStrictEqual',
      })
    }

    if (savedEventTimestamp === undefined) {
      throw new assert.AssertionError({
        message: 'Could not find timestamp of saved event',
        actual: savedEventTimestamp,
        expected: undefined,
        operator: 'notStrictEqual',
      })
    }

    const savedEvent: SavedEvent = {
      ...event,
      threadId: currentThreadId,
      threadCounter: savedEventThreadCounter,
      timestamp: savedEventTimestamp,
    }

    for (let i = 0; i < threadCounters.length; ++i) {
      threadCounters[i]++
    }

    const cursor = threadArrayToCursor(threadCounters)

    return {
      event: savedEvent,
      cursor,
    }
  } catch (error) {
    const errorMessage =
      error != null && error.message != null ? error.message : ''

    const errorCode = error != null && error.code != null ? error.code : ''

    if (errorMessage.indexOf('transaction within a transaction') > -1) {
      return await saveEvent(pool, event)
    }

    try {
      await database.exec('ROLLBACK;')
    } catch (e) {}

    if (errorMessage === 'SQLITE_ERROR: integer overflow') {
      throw new EventstoreFrozenError()
    } else if (
      errorCode === 'SQLITE_CONSTRAINT' &&
      errorMessage.indexOf('aggregate') > -1
    ) {
      throw new ConcurrentError(event.aggregateId)
    } else if (
      errorCode === 'SQLITE_CONSTRAINT' &&
      errorMessage.indexOf('PRIMARY') > -1
    ) {
      return await saveEvent(pool, event)
    } else {
      throw error
    }
  }
}

export default saveEvent
