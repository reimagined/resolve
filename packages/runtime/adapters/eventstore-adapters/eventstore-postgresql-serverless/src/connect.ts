import getLog from './get-log'
import type {
  PostgresqlAdapterPoolConnectedProps,
  ConnectionDependencies,
  AdapterPool,
  AdapterPoolPrimal,
  PostgresqlAdapterConfig,
} from './types'
import beginTransaction from './begin-transaction'
import commitTransaction from './commit-transaction'
import rollbackTransaction from './rollback-transaction'
import isTimeoutError from './is-timeout-error'
import { PostgresqlAdapterConfigSchema } from './types'
import { validate } from '@resolve-js/eventstore-base'

const connect = async (
  pool: AdapterPoolPrimal,
  {
    RDSDataService,
    escapeId,
    escape,
    fullJitter,
    executeStatement,
    coercer,
  }: ConnectionDependencies,
  config: PostgresqlAdapterConfig
): Promise<void> => {
  const log = getLog('connect')
  log.debug('configuring RDS data service client')

  validate(PostgresqlAdapterConfigSchema, config)

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

  const {
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    ...rdsConfig
  } = connectionOptions

  if (dbClusterOrInstanceArn == null || awsSecretStoreArn == null) {
    throw new Error(
      `Options "dbClusterOrInstanceArn" and "awsSecretStoreArn" are mandatory`
    )
  }

  const rdsDataService = new RDSDataService(rdsConfig)

  Object.assign<
    AdapterPoolPrimal,
    Partial<PostgresqlAdapterPoolConnectedProps>
  >(pool, {
    rdsDataService,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    databaseName,
    eventsTableName,
    secretsTableName,
    snapshotsTableName,
    subscribersTableName,
    fullJitter,
    coercer,
    executeStatement: executeStatement.bind(null, pool as AdapterPool),
    beginTransaction,
    commitTransaction,
    rollbackTransaction,
    escapeId,
    escape,
    isTimeoutError,
  })

  log.debug('RDS data service client configured')
}

export default connect
