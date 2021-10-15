import { getLog } from './get-log'
import type {
  ConnectionDependencies,
  PostgresqlAdapterPoolConnectedProps,
  AdapterPool,
  AdapterPoolPrimal,
  PostgresqlAdapterConfig,
} from './types'
import makePostgresClient from './make-postgres-client'
import makeKnownError from './make-known-error'

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
  } catch (error) {
    throw makeKnownError(error)
  }
  log.debug('connection to postgres databases established')
}

export default connect
