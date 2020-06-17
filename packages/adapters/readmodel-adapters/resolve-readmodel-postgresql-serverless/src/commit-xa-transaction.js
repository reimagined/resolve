import debugLevels from 'resolve-debug-levels'
import { XaTransactionNotFoundError } from 'resolve-readmodel-base'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:commit-xa-transaction'
)

const commitXATransaction = async (
  pool,
  readModelName,
  { xaTransactionId, countEvents }
) => {
  try {
    log.verbose('Commit XA-transaction to postgresql database started')
    await pool.rdsDataService.executeStatement({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      transactionId: xaTransactionId,
      sql: `SELECT 0`
    })

    if (countEvents) {
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

      let result = await pool.rdsDataService.executeStatement({
        resourceArn: pool.dbClusterOrInstanceArn,
        secretArn: pool.awsSecretStoreArn,
        transactionId: xaTransactionId,
        sql: `SELECT current_setting(${pool.escape(insideEventId)})`
      })

      const isInsideEvent = +pool.coercer(result.records[0][0])
      if (isInsideEvent) {
        await pool.rdsDataService.executeStatement({
          resourceArn: pool.dbClusterOrInstanceArn,
          secretArn: pool.awsSecretStoreArn,
          transactionId: xaTransactionId,
          sql: `
            ROLLBACK TO SAVEPOINT ${savepointId};
            RELEASE SAVEPOINT ${savepointId};
          `
        })
      }

      result = await pool.rdsDataService.executeStatement({
        resourceArn: pool.dbClusterOrInstanceArn,
        secretArn: pool.awsSecretStoreArn,
        transactionId: xaTransactionId,
        sql: `SELECT current_setting(${pool.escape(eventCountId)})`
      })

      const appliedEventsCount = +pool.coercer(result.records[0][0])

      return appliedEventsCount
    }

    await pool.rdsDataService.commitTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      transactionId: xaTransactionId
    })

    log.verbose('Commit XA-transaction to postgresql database succeed')
  } catch (error) {
    if (error != null && /Transaction .*? Is Not Found/i.test(error.message)) {
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
        if (xaResult[0].ok !== 'ok') {
          throw new Error('Re-throwing')
        }

        log.verbose('Commit XA-transaction to postgresql database succeed')
      } catch (err) {
        log.verbose(
          'Commit XA-transaction to postgresql database failed',
          error
        )
        throw new XaTransactionNotFoundError(xaTransactionId)
      }
    }

    log.verbose('Commit XA-transaction to postgresql database failed', error)
    throw error
  }
}

export default commitXATransaction
