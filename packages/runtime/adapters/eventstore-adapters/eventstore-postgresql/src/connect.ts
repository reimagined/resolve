import { getLog } from './get-log'
import type {
  ConnectionDependencies,
  PostgresqlAdapterPoolConnectedProps,
  AdapterPool,
  AdapterPoolPrimal,
  PostgresqlAdapterConfig,
} from './types'
import { ConnectionError } from '@resolve-js/eventstore-base'
import { DEFAULT_QUERY_TIMEOUT, MINIMAL_QUERY_TIMEOUT } from './constants'
import checkRequestTimeout from './check-request-timeout'

const connect = async (
  pool: AdapterPoolPrimal,
  {
    Postgres,
    escapeId,
    escape,
    fullJitter,
    executeStatement,
    coercer,
  }: ConnectionDependencies,
  config: PostgresqlAdapterConfig
): Promise<void> => {
  const log = getLog('connect')
  log.debug('configuring postgres client')

  let {
    databaseName,
    eventsTableName,
    snapshotsTableName,
    secretsTableName,
    subscribersTableName,
    // eslint-disable-next-line prefer-const
    ...connectionOptions
  } = config

  eventsTableName = eventsTableName ?? 'events'
  snapshotsTableName = snapshotsTableName ?? 'snapshots'
  secretsTableName = secretsTableName ?? 'secrets'
  subscribersTableName = subscribersTableName ?? 'subscribers'

  const vacantTimeInMillis = checkRequestTimeout(pool) ?? DEFAULT_QUERY_TIMEOUT

  const queryTimeout = Math.max(vacantTimeInMillis, MINIMAL_QUERY_TIMEOUT)
  const statementTimeout = Math.max(MINIMAL_QUERY_TIMEOUT, queryTimeout - 500)

  const oldConnection = pool.connection
  if (oldConnection !== undefined) {
    pool.connection = undefined
    oldConnection.end((err) => {
      if (err)
        log.error(`Error during disconnection before reconnection: ${err}`)
    })
  }

  try {
    const connection = new Postgres({
      keepAlive: false,
      connectionTimeoutMillis: queryTimeout,
      idle_in_transaction_session_timeout: queryTimeout,
      query_timeout: queryTimeout,
      statement_timeout: statementTimeout,
      ...connectionOptions,
    })

    connection.on('error', (error) => {
      pool.connectionErrors.push(error)
    })
    await connection.connect()

    Object.assign<
      AdapterPoolPrimal,
      Partial<PostgresqlAdapterPoolConnectedProps>
    >(pool, {
      databaseName,
      eventsTableName,
      snapshotsTableName,
      secretsTableName,
      connectionOptions,
      subscribersTableName,
      Postgres,
      fullJitter,
      coercer,
      executeStatement: executeStatement.bind(null, pool as AdapterPool),
      escapeId,
      escape,
      connection,
    })

    if (pool.executeStatement != null) {
      await pool.executeStatement('SELECT 0 AS "defunct"')
    }
  } catch (error) {
    if (error instanceof Error) {
      const connectionError = new ConnectionError(error.message)
      connectionError.stack = error.stack
      throw connectionError
    } else {
      throw error
    }
  }
  log.debug('connection to postgres databases established')
}

export default connect
