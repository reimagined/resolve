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

      try {
        await rdsDataService.rollbackTransaction({
          resourceArn: dbClusterOrInstanceArn,
          secretArn: awsSecretStoreArn,
          transactionId
        })
      } catch (err) {}

      break
    } catch (error) {
      if (PassthroughError.isPassthroughError(error)) {
        continue
      }

      console.warn(error)

      throw error
    }
  }
}

export default inlineLedgerForceStop
