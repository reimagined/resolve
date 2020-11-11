const subscribe = async (pool, readModelName, eventTypes, aggregateIds) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    tablePrefix,
    escapeId,
    escape,
  } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  try {
    await inlineLedgerRunQuery(
      `
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
    `,
      true
    )
  } catch (e) {}

  while (true) {
    try {
      await inlineLedgerRunQuery(
        `BEGIN IMMEDIATE;

         INSERT OR REPLACE INTO ${ledgerTableNameAsId}(
          "EventSubscriber", "EventTypes", "AggregateIds", "IsPaused", "Properties",
          "XaKey", "Cursor", "SuccessEvent", "FailedEvent", "Errors"
         ) VALUES (
           ${escape(readModelName)},
           ${
             eventTypes != null
               ? escape(JSON.stringify(eventTypes))
               : escape('null')
           },
           ${
             aggregateIds != null
               ? escape(JSON.stringify(aggregateIds))
               : escape('null')
           },
           COALESCE(
             (SELECT "IsPaused" FROM ${ledgerTableNameAsId}
             WHERE "EventSubscriber" = ${escape(readModelName)}),
             0
           ),
           COALESCE(
            (SELECT "Properties" FROM ${ledgerTableNameAsId}
            WHERE "EventSubscriber" = ${escape(readModelName)}),
            JSON('{}')
          ),
          (SELECT "XaKey" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escape(readModelName)}),
          (SELECT "Cursor" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escape(readModelName)}),
          (SELECT "SuccessEvent" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escape(readModelName)}),
          (SELECT "FailedEvent" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escape(readModelName)}),
          (SELECT "Errors" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escape(readModelName)})
         );

         COMMIT;
      `,
        true
      )
      break
    } catch (err) {
      if (!(err instanceof PassthroughError)) {
        throw err
      }
    }
  }
}

export default subscribe
