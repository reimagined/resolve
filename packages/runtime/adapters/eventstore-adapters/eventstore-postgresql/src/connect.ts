import { getLog } from './get-log'
import type {
  ConnectionDependencies,
  PostgresqlAdapterPoolConnectedProps,
  AdapterPool,
  AdapterPoolPrimal,
  PostgresqlAdapterConfig,
} from './types'

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

  const connection = new Postgres({
    keepAlive: false,
    connectionTimeoutMillis: 45000,
    idle_in_transaction_session_timeout: 45000,
    query_timeout: 45000,
    statement_timeout: 45000,
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
  log.debug('connection to postgres databases established')
}

export default connect
