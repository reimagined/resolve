import { ExternalMethods } from './types'

const subscribe: ExternalMethods['subscribe'] = async (
  pool,
  readModelName,
  eventTypes,
  aggregateIds
) => {
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
    await pool.maybeInit(pool)

    while (true) {
      try {
        await inlineLedgerForceStop(pool, readModelName)

        await inlineLedgerRunQuery(
          `START TRANSACTION;

         SELECT * FROM ${ledgerTableNameAsId}
         WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
         FOR UPDATE NOWAIT;

         INSERT INTO ${ledgerTableNameAsId}(
          \`EventSubscriber\`, \`EventTypes\`, \`AggregateIds\`, \`IsPaused\`
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
           0
         )
         ON DUPLICATE KEY UPDATE
         \`EventTypes\` = ${
           eventTypes != null
             ? escapeStr(JSON.stringify(eventTypes))
             : escapeStr('null')
         },
         \`AggregateIds\` = ${
           aggregateIds != null
             ? escapeStr(JSON.stringify(aggregateIds))
             : escapeStr('null')
         };

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

export default subscribe
