import type { MaybeInitMethod } from './types'

const maybeInit: MaybeInitMethod = async (pool) => {
  const { inlineLedgerRunQuery, tablePrefix, escapeId } = pool
  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
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
}

export default maybeInit
