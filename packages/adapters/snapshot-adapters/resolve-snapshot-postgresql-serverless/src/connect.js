import { DEFAULT_BUCKET_SIZE, DEFAULT_TABLE_NAME } from './constants'

const connect = async pool => {
  const {
    RDSDataService,
    executeStatement,
    beginTransaction,
    commitTransaction,
    rollbackTransaction
  } = pool

  if (pool.connectPromise != null) {
    return await pool.connectPromise
  }

  pool.connectPromise = (async () => {
    const {
      dbClusterOrInstanceArn,
      awsSecretStoreArn,
      databaseName,
      tableName,
      bucketSize,
      ...connectionOptions
    } = pool.config

    Object.assign(pool, {
      rdsDataService: new RDSDataService(connectionOptions),
      executeStatement: executeStatement.bind(null, pool),
      beginTransaction: beginTransaction.bind(null, pool),
      commitTransaction: commitTransaction.bind(null, pool),
      rollbackTransaction: rollbackTransaction.bind(null, pool),
      dbClusterOrInstanceArn,
      awsSecretStoreArn,
      bucketSize,
      databaseName,
      tableName
    })

    if (!Number.isInteger(pool.bucketSize) || pool.bucketSize < 1) {
      pool.bucketSize = DEFAULT_BUCKET_SIZE
    }

    if (pool.tableName == null || pool.tableName.constructor !== String) {
      pool.tableName = DEFAULT_TABLE_NAME
    }

    pool.counters = new Map()
  })()

  return await pool.connectPromise
}

export default connect
