import { RESERVED_EVENT_SIZE } from './constants'
import { AdapterPool } from './types'
import { StoredEvent } from '@resolve-js/eventstore-base'

const injectEvent = async function (
  pool: AdapterPool,
  event: StoredEvent
): Promise<void> {
  const {
    databaseName,
    eventsTableName,
    executeStatement,
    escapeId,
    escape,
  } = pool

  const serializedEvent = [
    `${escape(event.aggregateId)},`,
    `${+event.aggregateVersion},`,
    `${escape(event.type)},`,
    escape(JSON.stringify(event.payload != null ? event.payload : null)),
  ].join('')

  const byteLength = Buffer.byteLength(serializedEvent) + RESERVED_EVENT_SIZE

  const databaseNameAsId = escapeId(databaseName)
  const threadsTableAsId = escapeId(`${eventsTableName}-threads`)
  const eventsTableAsId = escapeId(eventsTableName)

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

  // prettier-ignore
  await executeStatement(`
    WITH "cte" AS (
      UPDATE ${databaseNameAsId}.${threadsTableAsId} SET
      "threadCounter" = GREATEST("threadCounter", ${+event.threadCounter} + 1)
      WHERE "threadId" = ${+event.threadId}
      RETURNING "threadId"
    )
    INSERT INTO ${databaseNameAsId}.${eventsTableAsId}(
    "threadId",
    "threadCounter",
    "timestamp",
    "aggregateId",
    "aggregateVersion",
    "type",
    "payload",
    "eventSize"
    ) VALUES (
      (SELECT "threadId" FROM "cte" LIMIT 1),
      ${+event.threadCounter},
      ${+event.timestamp},
      ${serializedEvent},
      ${byteLength}
    )
  `)
}

export default injectEvent
