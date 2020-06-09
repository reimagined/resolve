import debugLevels from 'resolve-debug-levels'
import { XaTransactionNotFoundError } from 'resolve-readmodel-base'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:rollback-xa-transaction'
)

const rollbackXATransaction = async (
  pool,
  readModelName,
  { xaTransactionId }
) => {
  try {
    log.verbose('Rollback XA-transaction to postgresql database started')
    await pool.rdsDataService.rollbackTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      transactionId: xaTransactionId
    })

    log.verbose('Rollback XA-transaction to postgresql database succeed')
  } catch (error) {
    log.verbose('Rollback XA-transaction to postgresql database failed', error)

    if (error != null && /Transaction .*? Is Not Found/i.test(error.message)) {
      throw new XaTransactionNotFoundError(xaTransactionId)
    }

    throw error
  }
}

export default rollbackXATransaction
