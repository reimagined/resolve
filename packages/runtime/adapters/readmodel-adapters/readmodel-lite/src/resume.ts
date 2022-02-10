import type { ExternalMethods } from './types'

const resume: ExternalMethods['resume'] = async (pool, readModelName) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    tablePrefix,
    fullJitter,
    escapeId,
    escapeStr,
  } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  try {
    pool.activePassthrough = true
    while (true) {
      try {
        await inlineLedgerRunQuery(
          `BEGIN IMMEDIATE;
        
         UPDATE ${ledgerTableNameAsId}
         SET "IsPaused" = 0
         WHERE "EventSubscriber" = ${escapeStr(readModelName)};

         COMMIT;
      `,
          true
        )
        break
      } catch (error) {
        if (!(error instanceof PassthroughError)) {
          throw error
        }

        try {
          await inlineLedgerRunQuery(`ROLLBACK`, true)
        } catch (err) {
          if (!(err instanceof PassthroughError)) {
            throw err
          }
        }

        await fullJitter(0)
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
