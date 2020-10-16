const resubscribe = async (pool, readModelName, eventTypes, aggregateIds) => {
  const {
    schemaName,
    escapeId,
    escape,
    dropReadModel,
    inlineLedgerForceStop,
    inlineLedgerExecuteStatement,
    PassthroughError,
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)

  while (true) {
    try {
      await inlineLedgerForceStop(pool, readModelName)
      await inlineLedgerExecuteStatement(
        pool,
        `
        WITH "CTE" AS (
         SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
         FOR NO KEY UPDATE NOWAIT
       )
        UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
        SET "Cursor" = NULL,
        "SuccessEvent" = NULL,
        "FailedEvent" = NULL,
        "Errors" = NULL,
        "IsPaused" = TRUE
        WHERE "EventSubscriber" = ${escape(readModelName)}
        AND (SELECT Count("CTE".*) FROM "CTE") = 1
      `
      )

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

      await inlineLedgerExecuteStatement(
        pool,
        `
        WITH "CTE" AS (
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

export default resubscribe
