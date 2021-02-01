import getLog from './get-log'
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
): Promise<any> => {
  const log = getLog('connect')
  log.debug('configuring postgres client')

  let {
    databaseName,
    eventsTableName,
    snapshotsTableName,
    secretsTableName,
    // eslint-disable-next-line prefer-const
    ...connectionOptions
  } = config

  eventsTableName = eventsTableName ?? 'events'
  snapshotsTableName = snapshotsTableName ?? 'snapshots'
  secretsTableName = secretsTableName ?? 'secrets'

  Object.assign<
    AdapterPoolPrimal,
    Partial<PostgresqlAdapterPoolConnectedProps>
  >(pool, {
    databaseName,
    eventsTableName,
    snapshotsTableName,
    secretsTableName,
    connectionOptions,
    Postgres,
    fullJitter,
    coercer,
    executeStatement: executeStatement.bind(null, pool as AdapterPool),
    escapeId,
    escape,
  })

  if (pool.executeStatement != null) {
    await pool.executeStatement('SELECT 0 AS "defunct"')
  }
  log.debug('connection to postgres databases established')
}

export default connect
