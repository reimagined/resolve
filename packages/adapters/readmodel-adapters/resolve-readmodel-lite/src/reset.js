const reset = async (pool, readModelName) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    dropReadModel,
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
        SET "Cursor" = NULL,
        "SuccessEvent" = NULL,
        "FailedEvent" = NULL,
        "Errors" = NULL,
        "IsPaused" = 1
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

  await dropReadModel(pool, readModelName)

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
}

export default reset
