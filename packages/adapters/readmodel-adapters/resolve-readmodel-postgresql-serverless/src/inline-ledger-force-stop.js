const inlineLedgerForceStop = async (pool, readModelName) => {
  const {
    PassthroughError,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    schemaName,
    escapeId,
    escape,
    rdsDataService,
    inlineLedgerExecuteStatement,
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)
  while (true) {
    try {
      const rows = await inlineLedgerExecuteStatement(
        pool,
        `SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
        `
      )
      if (rows.length < 1) {
        break
      }
      const transactionId = rows[0].XaKey
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
