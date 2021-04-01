import type { ExternalMethods } from './types'

const unsubscribe: ExternalMethods['unsubscribe'] = async (
  pool,
  readModelName
) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    dropReadModel,
    tablePrefix,
    fullJitter,
    escapeId,
    escapeStr,
  } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  try {
    pool.activePassthrough = true
    await pool.maybeInit(pool)

    while (true) {
      try {
        await inlineLedgerRunQuery(
          `BEGIN IMMEDIATE;

        UPDATE ${ledgerTableNameAsId}
        SET "Cursor" = NULL,
        "SuccessEvent" = NULL,
        "FailedEvent" = NULL,
        "Errors" = NULL,
        "IsPaused" = 1
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

    await dropReadModel(pool, readModelName)

    while (true) {
      try {
        await inlineLedgerRunQuery(
          `BEGIN IMMEDIATE;

         DELETE FROM ${ledgerTableNameAsId}
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
  } finally {
    pool.activePassthrough = false
  }
}

export default unsubscribe
