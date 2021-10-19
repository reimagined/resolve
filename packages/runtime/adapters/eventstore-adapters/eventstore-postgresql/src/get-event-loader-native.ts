import type {
  EventLoaderFilter,
  EventLoader,
} from '@resolve-js/eventstore-base'
import PgCursor from 'pg-cursor'
import type { AdapterPool } from './types'
import createLoadQuery from './create-load-query'
import processEventRows from './process-event-rows'
import checkRequestTimeout from './check-request-timeout'
import { DEFAULT_QUERY_TIMEOUT, MINIMAL_QUERY_TIMEOUT } from './constants'
import makeKnownError from './make-known-error'

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

  const vacantTimeInMillis = checkRequestTimeout(pool) ?? DEFAULT_QUERY_TIMEOUT

  const statementTimeout = Math.max(vacantTimeInMillis, MINIMAL_QUERY_TIMEOUT)

  let currentCursor = cursor
  const client = new pool.Postgres({
    keepAlive: false,
    connectionTimeoutMillis: statementTimeout,
    statement_timeout: statementTimeout,
    ...pool.connectionOptions,
  })
  client.on('error', (error) => {
    return
  })
  let pgCursor: QueriedPgCursor
  try {
    await client.connect()
    pgCursor = (client.query(
      new PgCursor(sqlQuery)
    ) as unknown) as QueriedPgCursor
  } catch (error) {
    throw makeKnownError(error)
  }

  return {
    async close() {
      await pgCursor.close()
      await client.end()
    },
    async loadEvents(limit: number) {
      try {
        const rows = await pgCursor.read(limit)
        const result = processEventRows(pool, currentCursor, rows)
        currentCursor = result.cursor
        return result
      } catch (error) {
        throw makeKnownError(error)
      }
    },
    get cursor() {
      return currentCursor
    },
    isNative: true,
  }
}

export default getEventLoaderNative
