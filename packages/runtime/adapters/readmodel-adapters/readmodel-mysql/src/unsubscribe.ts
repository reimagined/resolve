import { ExternalMethods } from './types'

const unsubscribe: ExternalMethods['unsubscribe'] = async (
  pool,
  readModelName
) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    inlineLedgerForceStop,
    dropReadModel,
    tablePrefix,
    escapeId,
    escapeStr,
  } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  try {
    pool.activePassthrough = true
    await pool.maybeInit(pool)

    while (true) {
      try {
        await inlineLedgerForceStop(pool, readModelName)
        await inlineLedgerRunQuery(
          `START TRANSACTION;
        
        SELECT * FROM ${ledgerTableNameAsId}
        WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
        FOR UPDATE NOWAIT;

        UPDATE ${ledgerTableNameAsId}
        SET \`Cursor\` = NULL,
        \`SuccessEvent\` = NULL,
        \`FailedEvent\` = NULL,
        \`Errors\` = NULL,
        \`IsPaused\` = TRUE
        WHERE \`EventSubscriber\` = ${escapeStr(readModelName)};

        COMMIT;
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
          `START TRANSACTION;
        
         SELECT * FROM ${ledgerTableNameAsId}
         WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
         FOR UPDATE NOWAIT;

         DELETE FROM ${ledgerTableNameAsId}
         WHERE \`EventSubscriber\` = ${escapeStr(readModelName)};

         COMMIT;
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

export default unsubscribe
