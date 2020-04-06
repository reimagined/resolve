import debugLevels from 'resolve-debug-levels'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:commit-xa-transaction'
)

const commitXATransaction = async (pool, readModelName, transactionId) => {
  try {
    log.verbose('Commit XA-transaction to postgresql database started')

    const hexTransactionId = Buffer.from(`${readModelName}${transactionId}`)
      .toString('hex')
      .toLowerCase()
    const savepointId = `sv${hexTransactionId}`
    const setLocalId = `resolve.sl${hexTransactionId}`

    const result = await pool.rdsDataService.executeStatement({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      database: 'postgres',
      continueAfterTimeout: false,
      includeResultMetadata: false,
      sql: `
        ROLLBACK TO SAVEPOINT ${savepointId};
        SELECT current_setting(${pool.escape(setLocalId)})
      `
    })

    const appliedEventsCount = ~~pool.coercer(result[0])

    await pool.rdsDataService
      .commitTransaction({
        resourceArn: pool.dbClusterOrInstanceArn,
        secretArn: pool.awsSecretStoreArn,
        transactionId
      })
      .promise()

    log.verbose('Commit XA-transaction to postgresql database succeed')
    pool.eventsCount = null

    return appliedEventsCount
  } catch (error) {
    log.verbose('Commit XA-transaction to postgresql database failed', error)

    throw error
  }
}

export default commitXATransaction
