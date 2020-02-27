import {
  RESERVED_EVENT_SIZE,
  REMAINING_CONNECTIONS_REGEXP,
  STATEMENT_TIMEOUT_CODE
} from './constants'

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

  while (true) {
    try {
      // prettier-ignore
      await executeStatement(
        `WITH "vector_id" AS (
          SELECT "threadId", "threadCounter"
          FROM ${databaseNameAsId}.${threadsTableAsId}
          FOR UPDATE 
          OFFSET FLOOR(Random() * 256)
          LIMIT 1
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

      break
    } catch (error) {
      const errorMessage =
        error != null && error.message != null ? error.message : ''
      const errorCode = error != null && error.code != null ? error.code : ''

      if (
        REMAINING_CONNECTIONS_REGEXP.test(errorMessage) ||
        STATEMENT_TIMEOUT_CODE === errorCode
      ) {
        continue
      } else {
        throw error
      }
    }
  }
}

export default saveEventOnly
