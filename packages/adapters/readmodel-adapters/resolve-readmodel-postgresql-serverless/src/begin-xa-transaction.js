import debugLevels from 'resolve-debug-levels'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:begin-xa-transaction'
)

const beginXATransaction = async (pool, readModelName) => {
  try {
    log.verbose('Begin XA-transaction to postgresql database started')
    const {
      transactionId: xaTransactionId
    } = await pool.rdsDataService.beginTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      database: 'postgres'
    })

    const savepointId = pool.generateGuid(readModelName, xaTransactionId)
    const eventCountId = `resolve.${pool.generateGuid(
      readModelName,
      xaTransactionId,
      'eventCountId'
    )}`
    const insideEventId = `resolve.${pool.generateGuid(
      readModelName,
      xaTransactionId,
      'insideEventId'
    )}`

    if (xaTransactionId == null) {
      throw new Error('Begin XA-transaction returned null xaTransactionId')
    }

    await pool.rdsDataService.executeStatement({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      database: 'postgres',
      continueAfterTimeout: false,
      includeResultMetadata: false,
      transactionId: xaTransactionId,
      sql: `
        SAVEPOINT ${savepointId};
        SET LOCAL ${eventCountId} = 0;
        SET LOCAL ${insideEventId} = 0;
        RELEASE SAVEPOINT ${savepointId};
      `
    })

    log.verbose('Begin XA-transaction to postgresql database succeed')

    return xaTransactionId
  } catch (error) {
    log.verbose('Begin XA-transaction to postgresql database failed', error)

    throw error
  }
}

export default beginXATransaction
