import debugLevels from 'resolve-debug-levels'

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
    while (true) {
      try {
        await pool.rdsDataService.rollbackTransaction({
          resourceArn: pool.dbClusterOrInstanceArn,
          secretArn: pool.awsSecretStoreArn,
          transactionId: xaTransactionId
        })
        break
      } catch (err) {
        if (pool.isTimeoutError(err)) {
          continue
        }
        throw err
      }
    }

    log.verbose('Rollback XA-transaction to postgresql database succeed')

    return true
  } catch (error) {
    if (error != null && /Transaction .*? Is Not Found/i.test(error.message)) {
      while (true) {
        try {
          const xaResult = await pool.rdsDataService.executeStatement({
            resourceArn: pool.dbClusterOrInstanceArn,
            secretArn: pool.awsSecretStoreArn,
            database: 'postgres',
            continueAfterTimeout: false,
            includeResultMetadata: false,
            sql: `
              WITH "cte" AS (
                DELETE FROM ${pool.escapeId(pool.schemaName)}.${pool.escapeId(
              `__${pool.schemaName}__XA__`
            )}
                WHERE "timestamp" < CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) - 86400000
              )
              SELECT 'ok' AS "ok"
              FROM ${pool.escapeId(pool.schemaName)}.${pool.escapeId(
              `__${pool.schemaName}__XA__`
            )}
              WHERE "xa_key" = ${pool.escape(
                pool.hash512(`${xaTransactionId}${readModelName}`)
              )}
            `
          })

          log.verbose('Rollback XA-transaction to postgresql database succeed')

          return xaResult.length === 0 ? true : false
        } catch (err) {
          if (pool.isTimeoutError(err)) {
            continue
          }

          log.verbose(
            'Rollback XA-transaction to postgresql database failed',
            error
          )
          throw error
        }
      }
    }

    log.verbose('Rollback XA-transaction to postgresql database failed', error)
    throw error
  }
}

export default rollbackXATransaction
