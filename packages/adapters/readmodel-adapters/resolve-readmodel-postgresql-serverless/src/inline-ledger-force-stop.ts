import type { InlineLedgerForceStopMethod } from './types'

const inlineLedgerForceStop: InlineLedgerForceStopMethod = async (
  pool,
  readModelName
) => {
  const {
    PassthroughError,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    schemaName,
    escapeId,
    escapeStr,
    rdsDataService,
    inlineLedgerExecuteStatement,
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)
  const trxTableNameAsId = escapeId(`__${schemaName}__TRX__`)

  while (true) {
    try {
      const rows = (await inlineLedgerExecuteStatement(
        pool,
        `WITH "cte" AS (
          DELETE FROM ${databaseNameAsId}.${trxTableNameAsId}
          WHERE "Timestamp" < CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) - 86400000
          RETURNING *
        )
        SELECT "B"."XaValue" FROM ${databaseNameAsId}.${ledgerTableNameAsId} "A"
        LEFT JOIN ${databaseNameAsId}.${trxTableNameAsId} "B"
        ON "A"."XaKey" = "B"."XaKey"
        WHERE "A"."EventSubscriber" = ${escapeStr(readModelName)}
        AND COALESCE((SELECT LEAST(Count("cte".*), 0) FROM "cte"), 0) = 0
        `
      )) as Array<{ XaValue: string }>
      if (rows.length < 1) {
        break
      }
      const transactionId = rows[0].XaValue
      if (transactionId == null) {
        return
      }

      try {
        await rdsDataService.rollbackTransaction({
          resourceArn: dbClusterOrInstanceArn,
          secretArn: awsSecretStoreArn,
          transactionId,
        })
      } catch (err) {
        if (
          !(
            err != null &&
            (/Transaction .*? Is Not Found/i.test(err.message) ||
              /Transaction .*? Is Not Found/i.test(err.stack) ||
              /Transaction is expired/i.test(err.message) ||
              /Transaction is expired/i.test(err.stack) ||
              /Invalid transaction ID/i.test(err.message) ||
              /Invalid transaction ID/i.test(err.stack))
          )
        ) {
          throw err
        }
      }

      break
    } catch (error) {
      if (error instanceof PassthroughError) {
        continue
      }

      throw error
    }
  }
}

export default inlineLedgerForceStop
