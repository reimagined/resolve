import type { AdapterPool } from './types'
import createLoadQuery from './create-load-query'
import processEventRows from './process-event-rows'
import {
  CursorFilter,
  StoredEventBatchPointer,
  emptyLoadEventsResult,
} from '@resolve-js/eventstore-base'

const loadEventsByCursor = async (
  pool: AdapterPool,
  { eventTypes, aggregateIds, cursor, limit }: CursorFilter
): Promise<StoredEventBatchPointer> => {
  const sqlQuery = createLoadQuery(pool, {
    eventTypes,
    aggregateIds,
    cursor,
    limit,
  })

  if (sqlQuery === null) {
    return emptyLoadEventsResult(cursor)
  }

  const rows = await pool.executeStatement(sqlQuery)
  return processEventRows(pool, cursor, rows)
}

export default loadEventsByCursor
