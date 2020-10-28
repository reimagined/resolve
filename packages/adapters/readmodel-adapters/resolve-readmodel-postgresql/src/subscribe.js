const subscribe = async (pool, readModelName, eventTypes, aggregateIds) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    inlineLedgerForceStop,
    schemaName,
    tablePrefix,
    escapeId,
    escape,
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`${tablePrefix}__${schemaName}__LEDGER__`)

  try {
    await inlineLedgerRunQuery(`
      CREATE TABLE IF NOT EXISTS ${databaseNameAsId}.${ledgerTableNameAsId}(
        "EventSubscriber" VARCHAR(190) NOT NULL,
        "IsPaused" BOOLEAN NOT NULL,
        "EventTypes" JSONB NOT NULL,
        "AggregateIds" JSONB NOT NULL,
        "XaKey" VARCHAR(190) NULL,
        "Cursor" JSONB NULL,
        "SuccessEvent" JSONB NULL,
        "FailedEvent" JSONB NULL,
        "Errors" JSONB NULL,
        "Properties" JSONB DEFAULT '{}'::JSONB,
        "Schema" JSONB NULL,
        PRIMARY KEY("EventSubscriber")
      );
      
      CREATE TABLE IF NOT EXISTS ${databaseNameAsId}.${ledgerTableNameAsId}(
        "XaKey" VARCHAR(190) NOT NULL,
        "XaValue" VARCHAR(190) NOT NULL,
        "Timestamp" BIGINT,
        PRIMARY KEY("XaKey")
      );
    `)
  } catch(e) {}

  while (true) {
    try {
      await inlineLedgerForceStop(pool, readModelName)

      await inlineLedgerRunQuery(
        `WITH "CTE" AS (
         SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
         FOR UPDATE NOWAIT
        )
         INSERT INTO ${databaseNameAsId}.${ledgerTableNameAsId}(
          "EventSubscriber", "EventTypes", "AggregateIds", "IsPaused"
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
           COALESCE(NULLIF((SELECT Count("CTE".*) < 2 FROM "CTE"), TRUE), FALSE)
         )
         ON CONFLICT ("EventSubscriber") DO UPDATE SET
         "EventTypes" = ${
           eventTypes != null
             ? escape(JSON.stringify(eventTypes))
             : escape('null')
         },
         "AggregateIds" = ${
           aggregateIds != null
             ? escape(JSON.stringify(aggregateIds))
             : escape('null')
         }
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

export default subscribe
