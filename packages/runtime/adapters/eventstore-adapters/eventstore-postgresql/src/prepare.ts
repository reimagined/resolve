import type {
  AdapterPoolPrimal,
  PostgresqlAdapterConfig,
  ConnectionDependencies,
  AdapterPool,
  PostgresqlAdapterPoolConnectedProps,
} from './types'

const prepare = (
  pool: AdapterPoolPrimal,
  config: PostgresqlAdapterConfig,
  {
    Postgres,
    escapeId,
    escape,
    fullJitter,
    executeStatement,
  }: ConnectionDependencies
): void => {
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
  })
}

export default prepare
