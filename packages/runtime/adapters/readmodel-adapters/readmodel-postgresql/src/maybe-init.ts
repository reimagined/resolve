import type { MaybeInitMethod } from './types'

const maybeInit: MaybeInitMethod = async (pool) => {
  const { inlineLedgerRunQuery, schemaName, tablePrefix, escapeId } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(
    `${tablePrefix}__${schemaName}__LEDGER__`
  )
  const trxTableNameAsId = escapeId(`${tablePrefix}__${schemaName}__TRX__`)

  try {
    await inlineLedgerRunQuery(`
      CREATE TABLE IF NOT EXISTS ${databaseNameAsId}.${ledgerTableNameAsId}(
        "EventSubscriber" VARCHAR(190) NOT NULL,
        "IsPaused" BOOLEAN NOT NULL,
        "EventTypes" JSONB NOT NULL,
        "AggregateIds" JSONB NOT NULL,
        "XaKey" VARCHAR(190) NULL,
        "Cursor" JSONB NULL,
        "SuccessEvent" JSONB NULL,
        "FailedEvent" JSONB NULL,
        "Errors" JSONB NULL,
        "Schema" JSONB NULL,
        PRIMARY KEY("EventSubscriber")
      );
      
      CREATE TABLE IF NOT EXISTS ${databaseNameAsId}.${trxTableNameAsId}(
        "XaKey" VARCHAR(190) NOT NULL,
        "XaValue" VARCHAR(190) NOT NULL,
        "Timestamp" BIGINT,
        PRIMARY KEY("XaKey")
      );
    `)
  } catch (e) {}
}

export default maybeInit
