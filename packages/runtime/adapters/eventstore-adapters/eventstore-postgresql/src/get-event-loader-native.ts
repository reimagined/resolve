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
import {
  isConnectionTerminatedError,
  makeConnectionError,
  makeKnownError,
} from './errors'

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
  let connectionTerminated = false
  client.on('error', (error) => {
    if (isConnectionTerminatedError(error)) {
      connectionTerminated = true
    }
    return
  })
  let pgCursor: QueriedPgCursor
  try {
    await client.connect()
  } catch (error) {
    throw makeConnectionError(error)
  }
  try {
    pgCursor = (client.query(
      new PgCursor(sqlQuery)
    ) as unknown) as QueriedPgCursor
  } catch (error) {
    await client.end()
    throw makeKnownError(error) ?? error
  }

  const eventLoader: EventLoader = {
    async close() {
      pool.eventLoaders.delete(eventLoader)
      // await pgCursor.close() // may never resolve due to https://github.com/brianc/node-postgres/issues/2642
      // client.end is enough anyway since cursor lives as long as the connection
      // client end may still hang if connection terminated and pgcursor exists
      if (!connectionTerminated) {
        await client.end()
      }
    },
    async loadEvents(limit: number) {
      try {
        const rows = await pgCursor.read(limit)
        const result = processEventRows(pool, currentCursor, rows)
        currentCursor = result.cursor
        return result
      } catch (error) {
        if (isConnectionTerminatedError(error)) {
          connectionTerminated = true
        }
        throw makeKnownError(error) ?? error
      }
    },
    get cursor() {
      return currentCursor
    },
    isNative: true,
  }

  pool.eventLoaders.add(eventLoader)

  return eventLoader
}

export default getEventLoaderNative
