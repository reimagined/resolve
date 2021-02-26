import type { ExternalMethods } from './types'

const resubscribe: ExternalMethods['resubscribe'] = async (
  pool,
  readModelName,
  eventTypes,
  aggregateIds
) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    dropReadModel,
    tablePrefix,
    fullJitter,
    escapeId,
    escapeStr,
  } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  try {
    pool.activePassthrough = true
    while (true) {
      try {
        await inlineLedgerRunQuery(
          `BEGIN IMMEDIATE;
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

        break
      } catch (error) {
        try {
          await inlineLedgerRunQuery(`ROLLBACK;`, true)
        } catch (e) {}

        if (/^SQLITE_ERROR:.*? already exists$/.test(error.message)) {
          break
        }
      }
    }

    while (true) {
      try {
        await inlineLedgerRunQuery(
          `
        BEGIN IMMEDIATE;

        UPDATE ${ledgerTableNameAsId}
        SET "Cursor" = NULL,
        "SuccessEvent" = NULL,
        "FailedEvent" = NULL,
        "Errors" = NULL,
        "IsPaused" = 1
        WHERE "EventSubscriber" = ${escapeStr(readModelName)};

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

        await fullJitter(0)
      }
    }

    await dropReadModel(pool, readModelName)

    while (true) {
      try {
        await inlineLedgerRunQuery(
          `
        BEGIN IMMEDIATE;

        INSERT OR REPLACE INTO ${ledgerTableNameAsId}(
          "EventSubscriber", "EventTypes", "AggregateIds", "IsPaused", "Properties",
          "XaKey", "Cursor", "SuccessEvent", "FailedEvent", "Errors"
        ) VALUES (
           ${escapeStr(readModelName)},
           ${
             eventTypes != null
               ? escapeStr(JSON.stringify(eventTypes))
               : escapeStr('null')
           },
           ${
             aggregateIds != null
               ? escapeStr(JSON.stringify(aggregateIds))
               : escapeStr('null')
           },
           COALESCE(
            (SELECT "IsPaused" FROM ${ledgerTableNameAsId}
            WHERE "EventSubscriber" = ${escapeStr(readModelName)}),
            0
          ),
          COALESCE(
           (SELECT "Properties" FROM ${ledgerTableNameAsId}
           WHERE "EventSubscriber" = ${escapeStr(readModelName)}),
           JSON('{}')
          ),
          (SELECT "XaKey" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escapeStr(readModelName)}),
          (SELECT "Cursor" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escapeStr(readModelName)}),
          (SELECT "SuccessEvent" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escapeStr(readModelName)}),
          (SELECT "FailedEvent" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escapeStr(readModelName)}),
          (SELECT "Errors" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escapeStr(readModelName)})
        );

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

        await fullJitter(0)
      }
    }
  } finally {
    pool.activePassthrough = false
  }
}

export default resubscribe
