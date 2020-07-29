import debugLevels from 'resolve-debug-levels'
import { OMIT_BATCH } from 'resolve-readmodel-base'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:commit-event'
)

const commitEvent = async (pool, readModelName, xaTransactionId, event) => {
  try {
    pool.xaTransactionId = null
    const savepointId = pool.generateGuid(readModelName, xaTransactionId)
    const eventListId = `resolve.${pool.generateGuid(
      readModelName,
      xaTransactionId,
      'eventListId'
    )}`
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
        SELECT set_config(${pool.escape(
          eventListId
        )}, (SELECT current_setting(${pool.escape(
        eventListId
      )}) || ${pool.escape(
        `${+event.threadId}:${+event.threadCounter};`
      )}), true);
        SET LOCAL ${insideEventId} = 0;
        RELEASE SAVEPOINT ${savepointId};
      `
    })

    log.verbose('Commit event to postgresql database succeed')
  } catch (error) {
    log.verbose('Commit event to postgresql database failed', error)

    if (
      error != null &&
      (/Transaction .*? Is Not Found/i.test(error.message) ||
        /deadlock detected/i.test(error.message) ||
        /StatementTimeoutException/i.test(error.message))
    ) {
      throw OMIT_BATCH
    }

    throw error
  }
}

export default commitEvent
