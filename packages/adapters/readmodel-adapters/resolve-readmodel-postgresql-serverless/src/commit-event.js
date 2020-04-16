import debugLevels from 'resolve-debug-levels'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:commit-event'
)

const commitEvent = async (pool, readModelName, transactionId) => {
  try {
    const hexTransactionId = Buffer.from(`${readModelName}${transactionId}`)
      .toString('hex')
      .toLowerCase()
    const savepointId = `sv${hexTransactionId}`
    const setLocalId = `resolve.sl${hexTransactionId}`

    await pool.rdsDataService.executeStatement({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      database: 'postgres',
      continueAfterTimeout: false,
      includeResultMetadata: false,
      sql: `
        SET LOCAL ${setLocalId} = ${++pool.eventsCount};
        RELEASE SAVEPOINT ${savepointId};
      `
    })

    log.verbose('Commit event to postgresql database succeed')
  } catch (error) {
    log.verbose('Commit event to postgresql database failed', error)

    throw error
  } finally {
    pool.transactionId = null
    pool.eventsCount = null
  }
}

export default commitEvent
