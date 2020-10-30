const resume = async (pool, readModelName, next) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    inlineLedgerForceStop,
    tablePrefix,
    escapeId,
    escape,
  } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

  while (true) {
    try {
      await inlineLedgerForceStop(pool, readModelName)
      await inlineLedgerRunQuery(
        `WITH \`CTE\` AS (
         SELECT * FROM ${ledgerTableNameAsId}
         WHERE \`EventSubscriber\` = ${escape(readModelName)}
         FOR NO KEY UPDATE NOWAIT
       )
        UPDATE ${ledgerTableNameAsId}
        SET \`IsPaused\` = FALSE
        WHERE \`EventSubscriber\` = ${escape(readModelName)}
        AND (SELECT Count(\`CTE\`.*) FROM \`CTE\`) = 1
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
