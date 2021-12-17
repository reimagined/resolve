import type { ExternalMethods } from './types'

const pause: ExternalMethods['pause'] = async (pool, readModelName) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    inlineLedgerForceStop,
    schemaName,
    tablePrefix,
    escapeId,
    escapeStr,
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(
    `${tablePrefix}__${schemaName}__LEDGER__`
  )
  try {
    pool.activePassthrough = true
    while (true) {
      try {
        await inlineLedgerForceStop(pool, readModelName)
        await pool.ensureAffectedOperation('pause', readModelName)

        await inlineLedgerRunQuery(
          `WITH "CTE" AS (
         SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escapeStr(readModelName)}
         FOR NO KEY UPDATE NOWAIT
       )
        UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
        SET "IsPaused" = TRUE
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
  } finally {
    pool.activePassthrough = false
  }
}

export default pause
