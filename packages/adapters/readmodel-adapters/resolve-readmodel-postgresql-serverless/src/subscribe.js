const subscribe = async (pool, readModelName, eventTypes, aggregateIds) => {
  const {
    schemaName,
    escapeId,
    escape,
    inlineLedgerForceStop,
    inlineLedgerExecuteStatement
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
         SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
         FOR UPDATE NOWAIT
        )
         INSERT INTO ${databaseNameAsId}.${ledgerTableNameAsId}(
          "EventSubscriber", "EventTypes", "AggregateIds", "IsPaused"
         ) VALUES (
           ${escape(readModelName)},
           ${eventTypes != null ? escape(JSON.stringify(eventTypes)) : 'NULL'},
           ${
             aggregateIds != null
               ? escape(JSON.stringify(aggregateIds))
               : 'NULL'
           },
           COALESCE(NULLIF((SELECT Count("CTE".*) FROM "CTE"), 1), FALSE)
         )
         ON CONFLICT ("EventSubscriber") DO UPDATE SET
         "EventTypes" = ${
           eventTypes != null ? escape(JSON.stringify(eventTypes)) : 'NULL'
         },
         "AggregateIds" = ${
           aggregateIds != null ? escape(JSON.stringify(aggregateIds)) : 'NULL'
         }
      `
      )
      break
    } catch (err) {}
  }
}

export default subscribe
