import { RESERVED_EVENT_SIZE } from './constants'

const saveEventOnly = async function(pool, event) {
  const { databaseName, tableName, executeStatement, escapeId, escape } = pool

  const serializedEvent = [
    `${escape(event.aggregateId)},`,
    `${+event.aggregateVersion},`,
    `${escape(event.type)},`,
    escape(JSON.stringify(event.payload != null ? event.payload : null))
  ].join('')

  const byteLength = Buffer.byteLength(serializedEvent) + RESERVED_EVENT_SIZE

  const databaseNameAsId = escapeId(databaseName)
  const threadsTableAsId = escapeId(`${tableName}-threads`)
  const eventsTableAsId = escapeId(tableName)

  // prettier-ignore
  await executeStatement(
    `WITH "random_thread_id" AS (
          SELECT "threadId"
          FROM ${databaseNameAsId}.${threadsTableAsId}
          OFFSET FLOOR(Random() * 256)
          LIMIT 1
        ), "vector_id" AS (
          SELECT "threadId", "threadCounter"
          FROM ${databaseNameAsId}.${threadsTableAsId}
          WHERE "threadId" = (
            SELECT "threadId" FROM "random_thread_id"
          )
          FOR NO KEY UPDATE 
        ), "update_vector_id" AS (
          UPDATE ${databaseNameAsId}.${threadsTableAsId}
          SET "threadCounter" = "threadCounter" + 1
          WHERE "threadId" = (
            SELECT "threadId" FROM "vector_id" LIMIT 1
          )
          RETURNING *
        ) INSERT INTO ${databaseNameAsId}.${eventsTableAsId}(
        "threadId",
        "threadCounter",
        "timestamp",
        "aggregateId",
        "aggregateVersion",
        "type",
        "payload",
        "eventSize"
        ) VALUES (
          (SELECT "threadId" FROM "vector_id" LIMIT 1),
          (SELECT "threadCounter" FROM "vector_id" LIMIT 1),
          ${+event.timestamp},
          ${serializedEvent},
          ${byteLength}
        )`
  )
}

export default saveEventOnly
