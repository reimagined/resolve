const reset = async (pool, readModelName) => {
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
         SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
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
      await inlineLedgerExecuteStatement(
        pool,
        `
        WITH "CTE" AS (
         SELECT "XaKey" FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escape(readModelName)}
         FOR NO KEY UPDATE NOWAIT
       )
        UPDATE ${databaseNameAsId}.${ledgerTableNameAsId}
        SET "IsPaused" = FALSE
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
}

export default reset
