import type { ExternalMethods } from './types'

const resume: ExternalMethods['resume'] = async (pool, readModelName) => {
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
        await pool.ensureAffectedOperation('resume', readModelName)
        await inlineLedgerRunQuery(
          `WITH "CTE" AS (
         SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escapeStr(readModelName)}
         FOR NO KEY UPDATE NOWAIT
       )
        UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
        SET "IsPaused" = FALSE
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

    return {
      type: 'build-direct-invoke',
      payload: {
        continue: true
      }
    }
  } finally {
    pool.activePassthrough = false
  }
}

export default resume
