import debugLevels from 'resolve-debug-levels'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:rollback-event'
)

const rollbackEvent = async (pool, readModelName, transactionId) => {
  try {
    const hexTransactionId = Buffer.from(`${readModelName}${transactionId}`)
      .toString('hex')
      .toLowerCase()
    const savepointId = `sv${hexTransactionId}`

    await pool.rdsDataService.executeStatement({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      database: 'postgres',
      continueAfterTimeout: false,
      includeResultMetadata: false,
      sql: `ROLLBACK TO SAVEPOINT ${savepointId}`
    })

    log.verbose('Rollback event to postgresql database succeed')
  } catch (error) {
    log.verbose('Rollback event to postgresql database failed', error)

    throw error
  } finally {
    pool.transactionId = null
    pool.eventsCount = null
  }
}

export default rollbackEvent
