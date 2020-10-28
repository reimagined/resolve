const resume = async (pool, readModelName, next) => {
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
  const ledgerTableNameAsId = escapeId(
    `${tablePrefix}__${schemaName}__LEDGER__`
  )

  while (true) {
    try {
      await inlineLedgerForceStop(pool, readModelName)
      await inlineLedgerRunQuery(
        `WITH "CTE" AS (
         SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
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

  await next()
}

export default resume
