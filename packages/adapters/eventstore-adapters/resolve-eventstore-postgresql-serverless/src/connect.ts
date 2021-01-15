import getLog from './get-log'
import { AdapterPool, AdapterSpecific } from './types'
import beginTransaction from './begin-transaction'
import commitTransaction from './commit-transaction'
import rollbackTransaction from './rollback-transaction'
import isTimeoutError from './is-timeout-error'

const connect = async (
  pool: AdapterPool,
  specific: AdapterSpecific
): Promise<any> => {
  const log = getLog('connect')
  log.debug('configuring RDS data service client')

  const {
    RDSDataService,
    escapeId,
    escape,
    fullJitter,
    executeStatement,
    coercer,
  } = specific

  let {
    databaseName,
    eventsTableName,
    snapshotsTableName,
    secretsTableName,
    // eslint-disable-next-line prefer-const
    ...connectionOptions
  } = pool.config

  eventsTableName = pool.coerceEmptyString(eventsTableName, 'events')
  snapshotsTableName = pool.coerceEmptyString(snapshotsTableName, 'snapshots')
  secretsTableName = pool.coerceEmptyString(secretsTableName, 'default')
  databaseName = pool.coerceEmptyString(databaseName)

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

  Object.assign(pool, {
    rdsDataService,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    databaseName,
    eventsTableName,
    secretsTableName,
    snapshotsTableName,
    fullJitter,
    coercer,
    executeStatement: executeStatement.bind(null, pool),
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
