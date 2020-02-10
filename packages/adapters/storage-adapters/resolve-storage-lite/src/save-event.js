import { ConcurrentError } from 'resolve-storage-base'

const saveEvent = async (pool, event) => {
  const { tableName, database, escapeId, escape } = pool
  try {
    const currentThreadId = Math.floor(Math.random() * 256)
    const eventsTableNameAsId = escapeId(tableName)
    const freezeTableNameAsString = escape(`${tableName}-freeze`)
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
  } catch (error) {
    const errorMessage =
      error != null && error.message != null ? error.message : ''
    const errorCode = error != null && error.code != null ? error.code : ''

    if (errorMessage === 'SQLITE_ERROR: integer overflow') {
      throw new Error('Event store is frozen')
    } else if (
      errorCode === 'SQLITE_CONSTRAINT' &&
      errorMessage.indexOf('aggregate') > -1
    ) {
      throw new ConcurrentError(event.aggregateId)
    } else if (
      errorCode === 'SQLITE_CONSTRAINT' &&
      errorMessage.indexOf('PRIMARY') > -1
    ) {
      try {
        await database.exec('ROLLBACK;')
      } catch (e) {}

      return await saveEvent(pool, event)
    } else {
      throw error
    }
  }
}

export default saveEvent
