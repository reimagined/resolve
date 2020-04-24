import debugLevels from 'resolve-debug-levels'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:begin-event'
)

const beginEvent = async (pool, readModelName, transactionId) => {
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
      sql: `SAVEPOINT ${savepointId}`
    })

    log.verbose('Begin event to postgresql database succeed')

    pool.eventsCount = pool.eventsCount != null ? pool.eventsCount : 0
    pool.readModelName = readModelName
    pool.transactionId = transactionId
  } catch (error) {
    log.verbose('Begin event to postgresql database failed', error)

    throw error
  }
}

export default beginEvent
