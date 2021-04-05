import type { ExternalMethods } from './types'

const subscribe: ExternalMethods['subscribe'] = async (
  pool,
  readModelName,
  eventTypes,
  aggregateIds
) => {
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
    await pool.maybeInit(pool)

    while (true) {
      try {
        await inlineLedgerRunQuery(
          `BEGIN IMMEDIATE;

         INSERT OR REPLACE INTO ${ledgerTableNameAsId}(
          "EventSubscriber", "EventTypes", "AggregateIds", "IsPaused",
          "XaKey", "Cursor", "SuccessEvent", "FailedEvent", "Errors"
         ) VALUES (
           ${escapeStr(readModelName)},
           ${
             eventTypes != null
               ? escapeStr(JSON.stringify(eventTypes))
               : escapeStr('null')
           },
           ${
             aggregateIds != null
               ? escapeStr(JSON.stringify(aggregateIds))
               : escapeStr('null')
           },
           COALESCE(
             (SELECT "IsPaused" FROM ${ledgerTableNameAsId}
             WHERE "EventSubscriber" = ${escapeStr(readModelName)}),
             0
           ),
          (SELECT "XaKey" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escapeStr(readModelName)}),
          (SELECT "Cursor" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escapeStr(readModelName)}),
          (SELECT "SuccessEvent" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escapeStr(readModelName)}),
          (SELECT "FailedEvent" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escapeStr(readModelName)}),
          (SELECT "Errors" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escapeStr(readModelName)})
         );

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

export default subscribe
