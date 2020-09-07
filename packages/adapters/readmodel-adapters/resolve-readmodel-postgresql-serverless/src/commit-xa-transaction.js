import debugLevels from 'resolve-debug-levels'

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
    while (true) {
      try {
        await pool.rdsDataService.executeStatement({
          resourceArn: pool.dbClusterOrInstanceArn,
          secretArn: pool.awsSecretStoreArn,
          transactionId: xaTransactionId,
          sql: `SELECT 0`,
        })
        break
      } catch (err) {
        if (pool.isTimeoutError(err)) {
          continue
        }
        throw err
      }
    }

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

      let result = null
      while (true) {
        try {
          result = await pool.rdsDataService.executeStatement({
            resourceArn: pool.dbClusterOrInstanceArn,
            secretArn: pool.awsSecretStoreArn,
            transactionId: xaTransactionId,
            sql: `SELECT current_setting(${pool.escape(insideEventId)})`,
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
              `,
            })
          }

          break
        } catch (err) {
          if (pool.isTimeoutError(err)) {
            continue
          }
          throw err
        }
      }

      while (true) {
        try {
          result = await pool.rdsDataService.executeStatement({
            resourceArn: pool.dbClusterOrInstanceArn,
            secretArn: pool.awsSecretStoreArn,
            transactionId: xaTransactionId,
            sql: `SELECT current_setting(${pool.escape(eventCountId)})`,
          })
          break
        } catch (err) {
          if (pool.isTimeoutError(err)) {
            continue
          }
          throw err
        }
      }

      const appliedEventsCount = +pool.coercer(result.records[0][0])

      return appliedEventsCount
    }

    while (true) {
      try {
        await pool.rdsDataService.commitTransaction({
          resourceArn: pool.dbClusterOrInstanceArn,
          secretArn: pool.awsSecretStoreArn,
          transactionId: xaTransactionId,
        })
        break
      } catch (err) {
        if (pool.isTimeoutError(err)) {
          continue
        }
        throw err
      }
    }

    log.verbose('Commit XA-transaction to postgresql database succeed')

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
            `,
          })

          log.verbose('Commit XA-transaction to postgresql database succeed')

          return countEvents ? 0 : xaResult.length > 0 ? true : false
        } catch (err) {
          if (pool.isTimeoutError(err)) {
            continue
          }

          log.verbose(
            'Commit XA-transaction to postgresql database failed',
            error
          )
          throw error
        }
      }
    }

    log.verbose('Commit XA-transaction to postgresql database failed', error)
    throw error
  }
}

export default commitXATransaction
