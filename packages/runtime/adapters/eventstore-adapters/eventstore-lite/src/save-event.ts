import type {
  InputEvent,
  StoredEvent,
  EventThreadData,
  StoredEventPointer,
} from '@resolve-js/eventstore-base'
import type { AdapterPool } from './types'
import {
  ConcurrentError,
  threadArrayToCursor,
  THREAD_COUNT,
  EventstoreFrozenError,
} from '@resolve-js/eventstore-base'
import assert from 'assert'
import isIntegerOverflowError from './integer-overflow-error'

const saveEvent = async (
  pool: AdapterPool,
  event: InputEvent
): Promise<StoredEventPointer> => {
  const { eventsTableName, executeStatement, escapeId, escape } = pool
  try {
    const currentThreadId = Math.floor(Math.random() * THREAD_COUNT)
    const eventsTableNameAsId = escapeId(eventsTableName)
    const freezeTableNameAsString = escape(`${eventsTableName}-freeze`)
    const serializedPayload =
      event.payload != null
        ? escape(JSON.stringify(event.payload))
        : escape('null')

    const insertResults = (await executeStatement(
      `
      WITH "freeze_check" AS (SELECT ABS("EventStoreIsFrozen") AS "freeze_zero" FROM (
        SELECT 0 AS "EventStoreIsFrozen"
      UNION ALL
        SELECT -9223372036854775808 AS "EventStoreIsFrozen"
        FROM "sqlite_master"
        WHERE "type" = 'table' AND 
        "name" = ${freezeTableNameAsString}
      ))
      INSERT INTO ${eventsTableNameAsId}(
        "threadId",
        "threadCounter",
        "timestamp",
        "aggregateId",
        "aggregateVersion",
        "type",
        "payload"
      ) VALUES(
        ${+currentThreadId} + COALESCE((SELECT "freeze_zero" FROM "freeze_check" LIMIT 1 OFFSET 1), 0),
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
      ) RETURNING "threadId", "threadCounter", "timestamp"`
    )) as Array<{
      threadId: EventThreadData['threadId']
      threadCounter: EventThreadData['threadCounter']
      timestamp: StoredEvent['timestamp']
    }>
    const insertResult = insertResults[0]

    const rows = (await executeStatement(
      `SELECT "threadId", MAX("threadCounter") AS "threadCounter" FROM 
    ${eventsTableNameAsId} GROUP BY "threadId" ORDER BY "threadId" ASC`
    )) as Array<{
      threadId: EventThreadData['threadId']
      threadCounter: EventThreadData['threadCounter']
    }>

    const threadCounters = new Array<number>(THREAD_COUNT)
    threadCounters.fill(-1)

    let savedEventThreadCounter = +insertResult.threadCounter
    let savedEventTimestamp = +insertResult.timestamp

    for (const row of rows) {
      threadCounters[row.threadId] = row.threadCounter
      if (row.threadId === currentThreadId) {
        threadCounters[row.threadId] = savedEventThreadCounter
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

    const savedEvent: StoredEvent = {
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

    const errorCode =
      error != null && error.code != null ? (error.code as string) : ''

    if (errorMessage.indexOf('transaction within a transaction') > -1) {
      return await saveEvent(pool, event)
    }

    if (isIntegerOverflowError(errorMessage)) {
      throw new EventstoreFrozenError()
    } else if (
      errorCode.startsWith('SQLITE_CONSTRAINT') &&
      errorMessage.indexOf('aggregate') > -1
    ) {
      throw new ConcurrentError(event.aggregateId)
    } else if (
      errorCode.startsWith('SQLITE_CONSTRAINT') &&
      errorMessage.indexOf('PRIMARY') > -1
    ) {
      return await saveEvent(pool, event)
    } else {
      throw error
    }
  }
}

export default saveEvent
