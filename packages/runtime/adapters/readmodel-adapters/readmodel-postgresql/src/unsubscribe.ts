import type { ExternalMethods } from './types'

const unsubscribe: ExternalMethods['unsubscribe'] = async (
  pool,
  readModelName,
  loadProcedureSource
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
  try {
    pool.activePassthrough = true
    await pool.maybeInit(pool)

    while (true) {
      try {
        await inlineLedgerForceStop(pool, readModelName)
        await pool.ensureAffectedOperation('unsubscribe', readModelName)

        await inlineLedgerRunQuery(
          `WITH "CTE" AS (
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

        await inlineLedgerRunQuery(
          `WITH "CTE" AS (
         SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escapeStr(readModelName)}
         FOR UPDATE NOWAIT
        )
         DELETE FROM ${databaseNameAsId}.${ledgerTableNameAsId}
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

    const procedureSource = await loadProcedureSource()

    if (procedureSource != null && procedureSource.constructor === String) {
      const procedureNameAsId = escapeId(`PROC-${readModelName}`)
      while (true) {
        try {
          await inlineLedgerRunQuery(
            `DROP FUNCTION ${databaseNameAsId}.${procedureNameAsId}`
          )

          break
        } catch (err) {
          if (!(err instanceof PassthroughError)) {
            break
          }
        }
      }
    }
  } finally {
    pool.activePassthrough = false
  }
}

export default unsubscribe
