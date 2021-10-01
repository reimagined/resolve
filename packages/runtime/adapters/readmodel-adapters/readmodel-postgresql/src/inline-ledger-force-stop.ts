import type { InlineLedgerForceStopMethod } from './types'

const inlineLedgerForceStop: InlineLedgerForceStopMethod = async (
  pool,
  readModelName
) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    schemaName,
    tablePrefix,
    escapeId,
    escapeStr,
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(
    `${tablePrefix}__${schemaName}__LEDGER__`
  )
  const trxTableNameAsId = escapeId(`${tablePrefix}__${schemaName}__TRX__`)

  while (true) {
    try {
      await inlineLedgerRunQuery(
        `WITH "CleanTrx" AS (
          DELETE FROM ${databaseNameAsId}.${trxTableNameAsId}
          WHERE "Timestamp" < CAST(extract(epoch from clock_timestamp()) * 1000 AS BIGINT) - 86400000
          RETURNING *
        )
        SELECT CASE WHEN "B"."XaValue" IS NOT NULL THEN pg_terminate_backend(CAST("B"."XaValue" AS INT))
        ELSE NULL END FROM ${databaseNameAsId}.${ledgerTableNameAsId} "A"
        LEFT JOIN ${databaseNameAsId}.${trxTableNameAsId} "B"
        ON "A"."XaKey" = "B"."XaKey"
        WHERE "A"."EventSubscriber" = ${escapeStr(readModelName)}
        AND COALESCE((SELECT LEAST(Count("CleanTrx".*), 0) FROM "CleanTrx"), 0) = 0
        `
      )
      break
    } catch (error) {
      if (
        /must be a member of the role whose process is being terminated or member of pg_signal_backend/.test(
          `${error}`
        )
      ) {
        break
      }
      if (error instanceof PassthroughError) {
        continue
      }

      throw error
    }
  }
}

export default inlineLedgerForceStop
