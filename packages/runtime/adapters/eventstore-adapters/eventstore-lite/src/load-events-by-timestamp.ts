import {
  TimestampFilter,
  EventsWithCursor,
  throwBadCursor,
} from '@resolve-js/eventstore-base'
import createQuery from './create-query'
import { AdapterPool } from './types'

const loadEventsByTimestamp = async (
  pool: AdapterPool,
  filter: TimestampFilter
): Promise<EventsWithCursor> => {
  const { executeStatement, escapeId, eventsTableName, shapeEvent } = pool

  const resultQueryCondition = createQuery(pool, filter)

  const tableNameAsId = escapeId(eventsTableName)

  const rows = await executeStatement(
    `SELECT * FROM ${tableNameAsId}
    ${resultQueryCondition}
    ORDER BY "timestamp" ASC, "threadCounter" ASC, "threadId" ASC
    LIMIT 0, ${+filter.limit}`
  )
  const events = []

  for (const event of rows) {
    events.push(shapeEvent(event))
  }

  return {
    get cursor() {
      return throwBadCursor() as any
    },
    events,
  }
}

export default loadEventsByTimestamp
