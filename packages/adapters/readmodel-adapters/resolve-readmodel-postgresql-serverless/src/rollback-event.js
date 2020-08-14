import debugLevels from 'resolve-debug-levels'
import { OMIT_BATCH } from 'resolve-readmodel-base'

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

export default rollbackEvent
