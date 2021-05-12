import {
  ConcurrentError,
  InputEvent,
  SavedEvent,
  threadArrayToCursor,
} from '@resolve-js/eventstore-base'
import { AdapterPool } from './types'
import { EventstoreFrozenError } from '@resolve-js/eventstore-base'

const saveEvent = async (
  pool: AdapterPool,
  event: InputEvent
): Promise<string> => {
  const { eventsTableName, database, escapeId, escape } = pool
  try {
    const currentThreadId = Math.floor(Math.random() * 256)
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
      );`
    )

    const rows = (await database.all(
      `SELECT "threadId", MAX("threadCounter") AS "threadCounter" FROM 
    ${eventsTableNameAsId} GROUP BY "threadId" ORDER BY "threadId" ASC`
    )) as Array<{
      threadId: SavedEvent['threadId']
      threadCounter: SavedEvent['threadCounter']
    }>

    const threadCounters = new Array<number>(256)
    threadCounters.fill(-1)
    for (const row of rows) {
      threadCounters[row.threadId] = row.threadCounter
    }
    for (let i = 0; i < threadCounters.length; ++i) {
      threadCounters[i]++
    }

    const cursor = threadArrayToCursor(threadCounters)
    await database.exec('COMMIT;')
    return cursor
  } catch (error) {
    const errorMessage =
      error != null && error.message != null ? error.message : ''
    const errorCode = error != null && error.code != null ? error.code : ''

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
