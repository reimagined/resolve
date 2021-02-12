import debugLevels from '@reimagined/debug-levels'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:rollback-transaction'
)

const rollbackTransaction = async (pool) => {
  try {
    log.verbose('Rollback transaction to postgresql database started')
    await pool.rdsDataService.rollbackTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      transactionId: pool.transactionId,
    })

    log.verbose('Rollback transaction to postgresql database succeed')
  } catch (error) {
    log.verbose('Rollback transaction to postgresql database failed', error)

    throw error
  } finally {
    pool.transactionId = null
  }
}

export default rollbackTransaction
