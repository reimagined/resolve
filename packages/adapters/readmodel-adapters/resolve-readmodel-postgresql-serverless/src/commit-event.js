import debugLevels from '@reimagined/debug-levels'
import { OMIT_BATCH } from '@reimagined/readmodel-base'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:commit-event'
)

const commitEvent = async (pool, readModelName, xaTransactionId) => {
  try {
    pool.xaTransactionId = null
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
    const eventCount = pool.eventCounters.get(xaTransactionId)

    if (eventCount == null) {
      throw new Error(`Xa-Transaction ${xaTransactionId} commit event failed`)
    }

    await pool.rdsDataService.executeStatement({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      database: 'postgres',
      continueAfterTimeout: false,
      includeResultMetadata: false,
      transactionId: xaTransactionId,
      sql: `
        SET LOCAL ${eventCountId} = ${eventCount + 1};
        SET LOCAL ${insideEventId} = 0;
        RELEASE SAVEPOINT ${savepointId};
      `,
    })

    pool.eventCounters.set(xaTransactionId, eventCount + 1)

    log.verbose('Commit event to postgresql database succeed')
  } catch (error) {
    log.verbose('Commit event to postgresql database failed', error)

    if (
      error != null &&
      (/Transaction .*? Is Not Found/i.test(error.message) ||
        /deadlock detected/i.test(error.message) ||
        pool.isTimeoutError(error))
    ) {
      throw OMIT_BATCH
    }

    throw error
  }
}

export default commitEvent
