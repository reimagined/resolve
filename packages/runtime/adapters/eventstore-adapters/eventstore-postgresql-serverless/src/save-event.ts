import {
  ConcurrentError,
  InputEvent,
  EventstoreFrozenError,
  SavedEvent,
  threadArrayToCursor,
} from '@resolve-js/eventstore-base'

import { RESERVED_EVENT_SIZE, LONG_NUMBER_SQL_TYPE } from './constants'
import { AdapterPool } from './types'
import assert from 'assert'

const saveEvent = async (
  pool: AdapterPool,
  event: InputEvent
): Promise<string> => {
  const {
    databaseName,
    eventsTableName,
    executeStatement,
    isTimeoutError,
    escapeId,
    escape,
  } = pool

  try {
    const serializedPayload: string = JSON.stringify(
      event.payload != null ? event.payload : null
    )
    const serializedEvent: string = [
      `${escape(event.aggregateId)},`,
      `${+event.aggregateVersion},`,
      `${escape(event.type)},`,
      escape(serializedPayload),
    ].join('')

    // TODO: Improve calculation byteLength depend on codepage and wide-characters
    const byteLength: number =
      Buffer.byteLength(serializedEvent) + RESERVED_EVENT_SIZE

    const databaseNameAsString: string = escape(databaseName)
    const databaseNameAsId: string = escapeId(databaseName)
    const freezeTableNameAsString: string = escape(`${eventsTableName}-freeze`)
    const threadsTableAsId: string = escapeId(`${eventsTableName}-threads`)
    const eventsTableAsId: string = escapeId(eventsTableName)

    savingEvent: while (true) {
      try {
        // prettier-ignore
        const rows = (await executeStatement(
          `WITH "freeze_check" AS (
              SELECT 0 AS "freeze_zero" WHERE (
                (SELECT 1 AS "EventStoreIsFrozen")
              UNION ALL
                (SELECT 1 AS "EventStoreIsFrozen"
                FROM "information_schema"."tables"
                WHERE "table_schema" = ${databaseNameAsString}
                AND "table_name" = ${freezeTableNameAsString})
              ) = 1
            ), "vacant_thread_id" AS (
              SELECT "threadId"
              FROM ${databaseNameAsId}.${threadsTableAsId}
              FOR NO KEY UPDATE SKIP LOCKED
              LIMIT 1
            ), "random_thread_id" AS (
              SELECT "threadId"
              FROM ${databaseNameAsId}.${threadsTableAsId}
              OFFSET FLOOR(Random() * 256)
              LIMIT 1
            ), "vector_id" AS (
              SELECT "threadId", "threadCounter"
              FROM ${databaseNameAsId}.${threadsTableAsId}
              WHERE "threadId" = COALESCE(
                (SELECT "threadId" FROM "vacant_thread_id"),
                (SELECT "threadId" FROM "random_thread_id")
              ) FOR NO KEY UPDATE
              LIMIT 1
            ), "update_vector_id" AS (
              UPDATE ${databaseNameAsId}.${threadsTableAsId}
              SET "threadCounter" = "threadCounter" + 1
              WHERE "threadId" = (
                SELECT "threadId" FROM "vector_id" LIMIT 1
              )
              RETURNING *
            ), "insert_event" AS (INSERT INTO ${databaseNameAsId}.${eventsTableAsId}(
              "threadId",
              "threadCounter",
              "timestamp",
              "aggregateId",
              "aggregateVersion",
              "type",
              "payload",
              "eventSize"
            ) VALUES (
              (SELECT "threadId" FROM "vector_id" LIMIT 1) +
              (SELECT "freeze_zero" FROM "freeze_check" LIMIT 1),
              (SELECT "threadCounter" FROM "vector_id" LIMIT 1),
              GREATEST(
                CAST(extract(epoch from clock_timestamp()) * 1000 AS ${LONG_NUMBER_SQL_TYPE}),
                ${+event.timestamp}
              ),
              ${serializedEvent},
              ${byteLength}
            )) SELECT "threadId", "threadCounter",
            (CASE WHEN (SELECT "threadId" FROM "vector_id" LIMIT 1) = "threadId" THEN "threadCounter"+1
              ELSE "threadCounter" END) AS "newThreadCounter"
            FROM ${databaseNameAsId}.${threadsTableAsId}
            ORDER BY "threadId" ASC`
        )) as Array<{
          threadId: SavedEvent['threadId']
          newThreadCounter: SavedEvent['threadCounter']
        }>
        assert.strictEqual(rows.length, 256, 'Thread table must have 256 rows')
        const threadCounters = new Array<number>(256)
        threadCounters.fill(0)
        for (const row of rows) {
          threadCounters[row.threadId] = row.newThreadCounter
        }
        return threadArrayToCursor(threadCounters)
      } catch (error) {
        if (isTimeoutError(error)) {
          while (true) {
            try {
              const rows = await executeStatement(
                `SELECT * FROM ${databaseNameAsId}.${eventsTableAsId} 
                WHERE "aggregateId"=${escape(event.aggregateId)} 
                AND "aggregateVersion"=${+event.aggregateVersion}
                LIMIT 1
                `
              )
              if (rows[0] == null) {
                continue savingEvent
              }
              if (
                rows[0].type === event.type &&
                rows[0].payload === serializedPayload
              ) {
                break
              } else {
                throw new ConcurrentError(event.aggregateId)
              }
            } catch (selectError) {
              if (isTimeoutError(selectError)) {
                continue
              } else {
                throw selectError
              }
            }
          }
        } else {
          throw error
        }
      }
    }
  } catch (error) {
    const errorMessage =
      error != null && error.message != null ? error.message : ''

    if (errorMessage.indexOf('subquery used as an expression') > -1) {
      throw new EventstoreFrozenError()
    } else if (/aggregateIdAndVersion/i.test(errorMessage)) {
      throw new ConcurrentError(event.aggregateId)
    } else {
      throw error
    }
  }
}

export default saveEvent
