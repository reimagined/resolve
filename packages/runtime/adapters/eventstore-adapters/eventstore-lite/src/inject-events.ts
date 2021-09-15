import { AdapterPool } from './types'
import { StoredEvent } from '@resolve-js/eventstore-base'

const injectEvents = async function (
  { eventsTableName, executeQuery, escapeId, escape }: AdapterPool,
  events: StoredEvent[]
): Promise<void> {
  if (events.length === 0) {
    return
  }

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
  }

  const eventsTableNameAsId = escapeId(eventsTableName)

  // prettier-ignore
  await executeQuery(`INSERT INTO ${eventsTableNameAsId}(
      "threadId",
      "threadCounter",
      "timestamp",
      "aggregateId",
      "aggregateVersion",
      "type",
      "payload"
    ) VALUES ${events
    .map(
      (event) => `(
      ${+event.threadId},
      ${+event.threadCounter},
      ${+event.timestamp},
      ${escape(event.aggregateId)},
      ${+event.aggregateVersion},
      ${escape(event.type)},
      json(CAST(${
        event.payload != null
          ? escape(JSON.stringify(event.payload))
          : escape('null')
      } AS BLOB))
    )`
    )
    .join(',')}`)
}

export default injectEvents
