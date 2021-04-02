import type { MaybeInitMethod } from './types'

const maybeInit: MaybeInitMethod = async (pool) => {
  const { inlineLedgerRunQuery, tablePrefix, escapeId } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  const trxTableNameAsId = escapeId(`${tablePrefix}__TRX__`)
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
}

export default maybeInit
