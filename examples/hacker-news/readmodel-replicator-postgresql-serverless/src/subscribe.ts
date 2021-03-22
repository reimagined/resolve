import type { ExternalMethods } from './types'

const subscribe: ExternalMethods['subscribe'] = async (
  pool,
  readModelName,
  eventTypes,
  aggregateIds
) => {
  const {
    schemaName,
    escapeId,
    escapeStr,
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
         FOR UPDATE NOWAIT
        )
         INSERT INTO ${databaseNameAsId}.${ledgerTableNameAsId}(
          "EventSubscriber", "EventTypes", "AggregateIds", "IsPaused"
         ) VALUES (
           ${escapeStr(readModelName)},
           ${escapeStr('null')},
           ${escapeStr('null')},
           COALESCE(NULLIF((SELECT Count("CTE".*) < 2 FROM "CTE"), TRUE), FALSE)
         )
         ON CONFLICT ("EventSubscriber") DO UPDATE SET
         "EventTypes" = ${escapeStr('null')},
         "AggregateIds" = ${escapeStr('null')}
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

export default subscribe
