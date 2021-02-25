import type { ExternalMethods } from './types'

const resubscribe: ExternalMethods['resubscribe'] = async (
  pool,
  readModelName,
  eventTypes,
  aggregateIds
) => {
  const {
    schemaName,
    escapeId,
    escapeStr,
    dropReadModel,
    inlineLedgerForceStop,
    inlineLedgerExecuteStatement,
    PassthroughError,
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(`__${schemaName}__LEDGER__`)
  try {
    pool.activePassthrough = true
    while (true) {
      try {
        await inlineLedgerForceStop(pool, readModelName)
        await inlineLedgerExecuteStatement(
          pool,
          `
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
      `
        )
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
