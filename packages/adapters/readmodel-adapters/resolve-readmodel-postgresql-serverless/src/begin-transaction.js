import debugLevels from 'resolve-debug-levels'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:begin-transaction'
)

const beginTransaction = async (pool, readModelName) => {
  try {
    log.verbose('Begin transaction to postgresql database started')
    if (pool.transactionId != null) {
      try {
        await pool.rollbackTransaction(pool.transactionId)
      } catch (error) {}
    }

    const { transactionId } = await pool.rdsDataService.beginTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      database: 'postgres'
    })

    if (transactionId == null) {
      throw new Error('Begin transaction returned null transactionId')
    }

    pool.transactionId = transactionId
    pool.readModelName = readModelName

    log.verbose('Begin transaction to postgresql database succeed')
  } catch (error) {
    log.verbose('Begin transaction to postgresql database failed', error)

    throw error
  }
}

export default beginTransaction
