import debugLevels from 'resolve-debug-levels'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:rollback-xa-transaction'
)

const rollbackXATransaction = async (pool, readModelName, transactionId) => {
  try {
    log.verbose('Rollback XA-transaction to postgresql database started')
    await pool.rdsDataService
      .rollbackTransaction({
        resourceArn: pool.dbClusterOrInstanceArn,
        secretArn: pool.awsSecretStoreArn,
        transactionId: transactionId
      })
      .promise()

    log.verbose('Rollback XA-transaction to postgresql database succeed')
    pool.eventsCount = null
  } catch (error) {
    log.verbose('Rollback XA-transaction to postgresql database failed', error)

    throw error
  }
}

export default rollbackXATransaction
