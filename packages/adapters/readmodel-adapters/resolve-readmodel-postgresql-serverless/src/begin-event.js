import debugLevels from 'resolve-debug-levels'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:begin-event'
)

const beginEvent = async (pool, readModelName, xaTransactionId) => {
  try {
    pool.xaTransactionId = xaTransactionId
    const savepointId = pool.generateGuid(readModelName, xaTransactionId)
    const insideEventId = `resolve.${pool.generateGuid(
      readModelName,
      xaTransactionId,
      'insideEventId'
    )}`

    await pool.rdsDataService.executeStatement({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      database: 'postgres',
      continueAfterTimeout: false,
      includeResultMetadata: false,
      transactionId: xaTransactionId,
      sql: `
        SAVEPOINT ${savepointId};
        SET LOCAL ${insideEventId} = 1;
      `
    })

    log.verbose('Begin event to postgresql database succeed')

    if (!pool.eventCounters.has(xaTransactionId)) {
      pool.eventCounters.set(xaTransactionId, 0)
    }

    pool.readModelName = readModelName
  } catch (error) {
    log.verbose('Begin event to postgresql database failed', error)

    throw error
  }
}

export default beginEvent
