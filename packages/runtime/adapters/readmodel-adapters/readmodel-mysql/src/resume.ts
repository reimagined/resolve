import type { ExternalMethods } from './types'

const resume: ExternalMethods['resume'] = async (pool, readModelName) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    inlineLedgerForceStop,
    tablePrefix,
    escapeId,
    escapeStr,
  } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  try {
    pool.activePassthrough = true
    while (true) {
      try {
        await inlineLedgerForceStop(pool, readModelName)
        await inlineLedgerRunQuery(
          `START TRANSACTION;
        
         SELECT * FROM ${ledgerTableNameAsId}
         WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
         FOR UPDATE NOWAIT;

         UPDATE ${ledgerTableNameAsId}
         SET \`IsPaused\` = FALSE
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

    return {
      type: 'build-direct-invoke',
      payload: {
        continue: true,
      },
    }
  } finally {
    pool.activePassthrough = false
  }
}

export default resume
