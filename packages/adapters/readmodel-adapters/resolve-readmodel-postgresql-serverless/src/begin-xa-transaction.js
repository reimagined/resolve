import debugLevels from 'resolve-debug-levels'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:begin-xa-transaction'
)

const beginXATransaction = async (pool, readModelName) => {
  try {
    log.verbose('Begin XA-transaction to postgresql database started')
    const { transactionId } = await pool.rdsDataService
      .beginTransaction({
        resourceArn: pool.dbClusterOrInstanceArn,
        secretArn: pool.awsSecretStoreArn,
        database: 'postgres'
      })
      .promise()

    const hexTransactionId = Buffer.from(`${readModelName}${transactionId}`)
      .toString('hex')
      .toLowerCase()
    const savepointId = `sv${hexTransactionId}`
    const setLocalId = `resolve.sl${hexTransactionId}`

    if (transactionId == null) {
      throw new Error('Begin XA-transaction returned null transactionId')
    }

    await pool.rdsDataService.executeStatement({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      database: 'postgres',
      continueAfterTimeout: false,
      includeResultMetadata: false,
      sql: `
        SAVEPOINT ${savepointId};
        SET LOCAL ${setLocalId} = 0;
      `
    })

    log.verbose('Begin XA-transaction to postgresql database succeed')
    pool.eventsCount = 0

    return transactionId
  } catch (error) {
    log.verbose('Begin XA-transaction to postgresql database failed', error)

    throw error
  }
}

export default beginXATransaction
