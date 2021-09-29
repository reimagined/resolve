import type {
  EventLoaderFilter,
  EventLoader,
} from '@resolve-js/eventstore-base'
import PgCursor from 'pg-cursor'
import type { AdapterPool } from './types'
import createLoadQuery from './create-load-query'
import processEventRows from './process-event-rows'

type QueriedPgCursor = {
  read(limit: number): Promise<any[]>
  close(): Promise<void>
}

const getEventLoaderNative = async (
  pool: AdapterPool,
  filter: EventLoaderFilter
): Promise<EventLoader> => {
  const { cursor, eventTypes, aggregateIds } = filter
  const sqlQuery = createLoadQuery(pool, {
    cursor,
    eventTypes,
    aggregateIds,
  })

  if (sqlQuery === null) {
    throw new Error(`Invalid event filter: ${JSON.stringify(filter)}`)
  }
  let currentCursor = cursor
  const client = new pool.Postgres({ ...pool.connectionOptions })
  await client.connect()
  const pgCursor = (client.query(
    new PgCursor(sqlQuery)
  ) as unknown) as QueriedPgCursor

  return {
    async close() {
      await pgCursor.close()
      await client.end()
    },
    async loadEvents(limit: number) {
      const rows = await pgCursor.read(limit)
      const result = processEventRows(pool, currentCursor, rows)
      currentCursor = result.cursor
      return result
    },
    get cursor() {
      return currentCursor
    },
    isNative: true,
  }
}

export default getEventLoaderNative
