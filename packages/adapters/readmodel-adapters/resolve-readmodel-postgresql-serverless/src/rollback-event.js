import debugLevels from 'resolve-debug-levels'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:rollback-event'
)

const rollbackEvent = async (pool, readModelName, xaTransactionId) => {
  try {
    pool.xaTransactionId = null
    const savepointId = pool.generateGuid(readModelName, xaTransactionId)

    await pool.rdsDataService.executeStatement({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      database: 'postgres',
      continueAfterTimeout: false,
      includeResultMetadata: false,
      transactionId: xaTransactionId,
      sql: `
        ROLLBACK TO SAVEPOINT ${savepointId};
        RELEASE SAVEPOINT ${savepointId};
      `
    })

    log.verbose('Rollback event to postgresql database succeed')
  } catch (error) {
    log.verbose('Rollback event to postgresql database failed', error)

    throw error
  }
}

export default rollbackEvent
