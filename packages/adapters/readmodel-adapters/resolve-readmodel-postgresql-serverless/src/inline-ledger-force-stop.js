const inlineLedgerForceStop = async (pool, readModelName) => {
  const {
    PassthroughError,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    schemaName,
    escapeId,
    escape,
    rdsDataService,
    inlineLedgerExecuteStatement
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)
  const trxTableNameAsId = escapeId(`__${schemaName}__TRX__`)

  while (true) {
    try {
      const rows = await inlineLedgerExecuteStatement(
        pool,
        `WITH "cte" AS (
          DELETE FROM ${databaseNameAsId}.${trxTableNameAsId}
          WHERE "Timestamp" < CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) - 86400000
          RETURNING *
        )
        SELECT "B"."XaValue" FROM ${databaseNameAsId}.${ledgerTableNameAsId} "A"
        LEFT JOIN ${databaseNameAsId}.${trxTableNameAsId} "B"
        ON "A"."XaKey" = "B"."XaKey"
        WHERE "A"."EventSubscriber" = ${escape(readModelName)}
        AND COALESCE((SELECT LEAST(Count("cte".*), 0) FROM "cte"), 0) = 0
        `
      )
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
          transactionId
        })
      } catch (err) {
        if (
          !(
            err != null &&
            (/Transaction .*? Is Not Found/i.test(err.message) ||
              /Invalid transaction ID/i.test(err.message))
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
