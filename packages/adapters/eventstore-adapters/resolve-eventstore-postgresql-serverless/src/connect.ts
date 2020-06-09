import getLog from './js/get-log'
import { AdapterPool, AdapterSpecific } from './types'
import beginTransaction from './js/begin-transaction'
import commitTransaction from './js/commit-transaction'
import rollbackTransaction from './js/rollback-transaction'
import { DEFAULT_BUCKET_SIZE } from './js/constants'

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
    coercer
  } = specific

  const {
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    databaseName,
    eventsTableName = 'events',
    snapshotsTableName = 'snapshots',
    secretsTableName,
    bucketSize,
    ...rdsConfig
  } = pool.config ?? {}

  pool.bucketSize = bucketSize as number

  if (!Number.isInteger(pool.bucketSize) || pool.bucketSize < 1) {
    pool.bucketSize = DEFAULT_BUCKET_SIZE
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
    escape
  })

  log.debug('RDS data service client configured')
}

export default connect
