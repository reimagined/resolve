const pause = async (pool, readModelName) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    inlineLedgerForceStop,
    tablePrefix,
    escapeId,
    escape,
  } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  while (true) {
    try {
      await inlineLedgerForceStop(pool, readModelName)

      await inlineLedgerRunQuery(
        `BEGIN TRANSACTION;
        
         SELECT * FROM ${ledgerTableNameAsId}
         WHERE \`EventSubscriber\` = ${escape(readModelName)}
         FOR UPDATE NOWAIT;

         UPDATE ${ledgerTableNameAsId}
         SET \`IsPaused\` = TRUE
         WHERE \`EventSubscriber\` = ${escape(readModelName)};

         COMMIT;
      `
      )

      break
    } catch (err) {
      if (!(err instanceof PassthroughError)) {
        throw err
      }
    }
  }
}

export default pause
