const resume = async (pool, readModelName, next) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    tablePrefix,
    fullJitter,
    escapeId,
    escape,
  } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  for (let retry = 0; ; retry++) {
    try {
      await inlineLedgerRunQuery(
        `BEGIN EXCLUSIVE;
        
         UPDATE ${ledgerTableNameAsId}
         SET "IsPaused" = 0
         WHERE "EventSubscriber" = ${escape(readModelName)};

         COMMIT;
      `,
        true
      )
      break
    } catch (error) {
      if (!(error instanceof PassthroughError)) {
        throw error
      }

      try {
        await inlineLedgerRunQuery(`ROLLBACK`, true)
      } catch (err) {
        if (!(err instanceof PassthroughError)) {
          throw err
        }
      }

      await fullJitter(retry)
    }
  }

  await next()
}

export default resume
