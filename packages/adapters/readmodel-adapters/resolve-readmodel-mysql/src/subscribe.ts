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
  const trxTableNameAsId = escapeId(`${tablePrefix}__TRX__`)
  try {
    pool.activePassthrough = true
    try {
      await inlineLedgerRunQuery(`
      CREATE TABLE IF NOT EXISTS ${ledgerTableNameAsId}(
        \`EventSubscriber\` VARCHAR(190) NOT NULL,
        \`IsPaused\` TINYINT NOT NULL,
        \`EventTypes\` JSON NOT NULL,
        \`AggregateIds\` JSON NOT NULL,
        \`XaKey\` VARCHAR(190) NULL,
        \`Cursor\` JSON NULL,
        \`SuccessEvent\` JSON NULL,
        \`FailedEvent\` JSON NULL,
        \`Errors\` JSON NULL,
        \`Properties\` JSON NOT NULL,
        \`Schema\` JSON NULL,
        PRIMARY KEY(\`EventSubscriber\`)
      );
      
      CREATE TABLE IF NOT EXISTS ${trxTableNameAsId}(
        \`XaKey\` VARCHAR(190) NOT NULL,
        \`XaValue\` VARCHAR(190) NOT NULL,
        \`Timestamp\` BIGINT,
        PRIMARY KEY(\`XaKey\`)
      );
    `)
    } catch (e) {}

    while (true) {
      try {
        await inlineLedgerForceStop(pool, readModelName)

        await inlineLedgerRunQuery(
          `START TRANSACTION;

         SELECT * FROM ${ledgerTableNameAsId}
         WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
         FOR UPDATE NOWAIT;

         INSERT INTO ${ledgerTableNameAsId}(
          \`EventSubscriber\`, \`EventTypes\`, \`AggregateIds\`, \`IsPaused\`, \`Properties\`
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
           0,
           CAST("{}" AS JSON)
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
