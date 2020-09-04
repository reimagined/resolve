import debugLevels from 'resolve-debug-levels'

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:begin-xa-transaction'
)

const beginXATransaction = async (pool, readModelName) => {
  try {
    log.verbose('Begin XA-transaction to postgresql database started')
    let xaTransactionId = null

    while (true) {
      try {
        xaTransactionId = null
        xaTransactionId = (
          await pool.rdsDataService.beginTransaction({
            resourceArn: pool.dbClusterOrInstanceArn,
            secretArn: pool.awsSecretStoreArn,
            database: 'postgres',
          })
        ).transactionId

        if (xaTransactionId == null) {
          continue
        }

        await pool.rdsDataService.executeStatement({
          resourceArn: pool.dbClusterOrInstanceArn,
          secretArn: pool.awsSecretStoreArn,
          database: 'postgres',
          transactionId: xaTransactionId,
          continueAfterTimeout: false,
          includeResultMetadata: false,
          sql: `
          WITH "cte" AS (
            DELETE FROM ${pool.escapeId(pool.schemaName)}.${pool.escapeId(
            `__${pool.schemaName}__XA__`
          )}
            WHERE "timestamp" < CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) - 86400000
          ) INSERT INTO ${pool.escapeId(pool.schemaName)}.${pool.escapeId(
            `__${pool.schemaName}__XA__`
          )}(
            "xa_key", "timestamp"
          ) VALUES (
            ${pool.escape(pool.hash512(`${xaTransactionId}${readModelName}`))},
            CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT)
          )
        `,
        })

        break
      } catch (err) {
        if (xaTransactionId != null) {
          try {
            await pool.rdsDataService.rollbackTransaction({
              resourceArn: pool.dbClusterOrInstanceArn,
              secretArn: pool.awsSecretStoreArn,
              transactionId: xaTransactionId,
            })
          } catch (e) {}
        }
      }
    }

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

    if (xaTransactionId == null) {
      throw new Error('Begin XA-transaction returned null xaTransactionId')
    }

    while (true) {
      try {
        await pool.rdsDataService.executeStatement({
          resourceArn: pool.dbClusterOrInstanceArn,
          secretArn: pool.awsSecretStoreArn,
          database: 'postgres',
          continueAfterTimeout: false,
          includeResultMetadata: false,
          transactionId: xaTransactionId,
          sql: `
            SAVEPOINT ${savepointId};
            SET LOCAL ${eventCountId} = 0;
            SET LOCAL ${insideEventId} = 0;
            RELEASE SAVEPOINT ${savepointId};
          `,
        })
        break
      } catch (err) {
        if (pool.isTimeoutError(err)) {
          continue
        }
        throw err
      }
    }

    log.verbose('Begin XA-transaction to postgresql database succeed')

    return xaTransactionId
  } catch (error) {
    log.verbose('Begin XA-transaction to postgresql database failed', error)

    throw error
  }
}

export default beginXATransaction
