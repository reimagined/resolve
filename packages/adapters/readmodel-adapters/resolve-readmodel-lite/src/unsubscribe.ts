import type { ExternalMethods } from './types'

const unsubscribe: ExternalMethods['unsubscribe'] = async (
  pool,
  readModelName
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
          `BEGIN IMMEDIATE;

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
          `BEGIN IMMEDIATE;

         DELETE FROM ${ledgerTableNameAsId}
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
  } finally {
    pool.activePassthrough = false
  }
}

export default unsubscribe
