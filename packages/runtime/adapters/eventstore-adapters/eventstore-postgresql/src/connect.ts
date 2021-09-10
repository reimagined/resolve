import { getLog } from './get-log'
import type {
  ConnectionDependencies,
  PostgresqlAdapterPoolConnectedProps,
  AdapterPool,
  AdapterPoolPrimal,
  PostgresqlAdapterConfig,
} from './types'
import { ConnectionError, ServiceBusyError } from '@resolve-js/eventstore-base'
import { isServiceBusyError } from './errors'
import makePostgresClient from './make-postgres-client'

const connect = async (
  pool: AdapterPoolPrimal,
  {
    Postgres,
    escapeId,
    escape,
    fullJitter,
    executeStatement,
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

  const oldConnection = pool.connection
  if (oldConnection !== undefined) {
    pool.connection = undefined
    oldConnection.end((err) => {
      if (err)
        log.error(`Error during disconnection before reconnection: ${err}`)
    })
  }

  const connection = makePostgresClient(pool, Postgres, connectionOptions)

  try {
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
      executeStatement: executeStatement.bind(null, pool as AdapterPool),
      escapeId,
      escape,
      connection,
    })

    if (pool.executeStatement != null) {
      await pool.executeStatement('SELECT 0 AS "defunct"')
    }
  } catch (error) {
    if (isServiceBusyError(error)) {
      const busyError = new ServiceBusyError(error.message)
      busyError.stack = error.stack
      throw busyError
    } else if (error instanceof Error) {
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
