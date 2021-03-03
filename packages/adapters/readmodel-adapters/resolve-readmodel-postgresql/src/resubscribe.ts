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
    inlineLedgerForceStop,
    dropReadModel,
    schemaName,
    tablePrefix,
    escapeId,
    escapeStr,
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(
    `${tablePrefix}__${schemaName}__LEDGER__`
  )
  const trxTableNameAsId = escapeId(`${tablePrefix}__${schemaName}__TRX__`)
  try {
    pool.activePassthrough = true
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
      
      CREATE TABLE IF NOT EXISTS ${databaseNameAsId}.${trxTableNameAsId}(
        "XaKey" VARCHAR(190) NOT NULL,
        "XaValue" VARCHAR(190) NOT NULL,
        "Timestamp" BIGINT,
        PRIMARY KEY("XaKey")
      );
    `)
    } catch (e) {}

    while (true) {
      try {
        await inlineLedgerForceStop(pool, readModelName)
        await inlineLedgerRunQuery(`
        WITH "CTE" AS (
         SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escapeStr(readModelName)}
         FOR NO KEY UPDATE NOWAIT
       )
        UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
        SET "Cursor" = NULL,
        "SuccessEvent" = NULL,
        "FailedEvent" = NULL,
        "Errors" = NULL,
        "IsPaused" = TRUE
        WHERE "EventSubscriber" = ${escapeStr(readModelName)}
        AND (SELECT Count("CTE".*) FROM "CTE") = 1
      `)

        break
      } catch (err) {
        if (!(err instanceof PassthroughError)) {
          throw err
        }
      }
    }

    await dropReadModel(pool, readModelName)

    while (true) {
      try {
        await inlineLedgerForceStop(pool, readModelName)

        await inlineLedgerRunQuery(`
        WITH "CTE" AS (
         SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escapeStr(readModelName)}
         FOR UPDATE NOWAIT
        )
         INSERT INTO ${databaseNameAsId}.${ledgerTableNameAsId}(
          "EventSubscriber", "EventTypes", "AggregateIds", "IsPaused"
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
           COALESCE(NULLIF((SELECT Count("CTE".*) < 2 FROM "CTE"), TRUE), FALSE)
         )
         ON CONFLICT ("EventSubscriber") DO UPDATE SET
         "EventTypes" = ${
           eventTypes != null
             ? escapeStr(JSON.stringify(eventTypes))
             : escapeStr('null')
         },
         "AggregateIds" = ${
           aggregateIds != null
             ? escapeStr(JSON.stringify(aggregateIds))
             : escapeStr('null')
         }
      `)
        break
      } catch (err) {
        if (!(err instanceof PassthroughError)) {
          throw err
        }
      }
    }
  } finally {
    pool.activePassthrough = false
  }
}

export default resubscribe
