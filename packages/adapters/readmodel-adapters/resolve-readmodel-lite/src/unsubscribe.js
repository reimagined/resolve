const unsubscribe = async (pool, readModelName) => {
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

  try {
    await inlineLedgerRunQuery(
      `BEGIN EXCLUSIVE;
      CREATE TABLE IF NOT EXISTS ${ledgerTableNameAsId}(
        "EventSubscriber" VARCHAR(190) NOT NULL,
        "IsPaused" TINYINT NOT NULL,
        "EventTypes" JSON NOT NULL,
        "AggregateIds" JSON NOT NULL,
        "XaKey" VARCHAR(190) NULL,
        "Cursor" JSON NULL,
        "SuccessEvent" JSON NULL,
        "FailedEvent" JSON NULL,
        "Errors" JSON NULL,
        "Properties" JSON NOT NULL,
        "Schema" JSON NULL,
        PRIMARY KEY("EventSubscriber")
      );
      COMMIT;
    `,
      true
    )
  } catch (err) {
    try {
      await inlineLedgerRunQuery(`ROLLBACK;`, true)
    } catch (e) {}
  }

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

         DELETE FROM ${ledgerTableNameAsId}
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

export default unsubscribe
