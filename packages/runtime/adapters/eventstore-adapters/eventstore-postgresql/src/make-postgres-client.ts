import type { AdapterPoolPrimal, ConnectionDependencies } from './types'

import { DEFAULT_QUERY_TIMEOUT, MINIMAL_QUERY_TIMEOUT } from './constants'
import checkRequestTimeout from './check-request-timeout'

const makePostgresClient = (
  pool: AdapterPoolPrimal,
  Postgres: ConnectionDependencies['Postgres'],
  connectionOptions: any
) => {
  const vacantTimeInMillis = checkRequestTimeout(pool) ?? DEFAULT_QUERY_TIMEOUT

  const queryTimeout = Math.max(vacantTimeInMillis, MINIMAL_QUERY_TIMEOUT)
  const statementTimeout = Math.max(MINIMAL_QUERY_TIMEOUT, queryTimeout - 500)

  const connection = new Postgres({
    keepAlive: false,
    connectionTimeoutMillis: queryTimeout,
    idle_in_transaction_session_timeout: queryTimeout,
    //query_timeout: queryTimeout,
    statement_timeout: statementTimeout,
    ...connectionOptions,
  })

  connection.on('error', (error) => {
    return
  })

  return connection
}

export default makePostgresClient
