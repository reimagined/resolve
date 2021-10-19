import type { ExternalMethods } from './types'

const subscribe: ExternalMethods['subscribe'] = async (
  pool,
  readModelName,
  eventTypes,
  aggregateIds,
  loadProcedureSource
) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    inlineLedgerForceStop,
    schemaName,
    tablePrefix,
    escapeId,
    escapeStr,
  } = pool

  const databaseNameAsId = escapeId(schemaName)
  const ledgerTableNameAsId = escapeId(
    `${tablePrefix}__${schemaName}__LEDGER__`
  )
  try {
    pool.activePassthrough = true
    await pool.maybeInit(pool)

    while (true) {
      try {
        await inlineLedgerForceStop(pool, readModelName)

        await inlineLedgerRunQuery(
          `WITH "CTE" AS (
         SELECT * FROM ${databaseNameAsId}.${ledgerTableNameAsId}
         WHERE "EventSubscriber" = ${escapeStr(readModelName)}
         FOR UPDATE NOWAIT
        )
         INSERT INTO ${databaseNameAsId}.${ledgerTableNameAsId}(
          "EventSubscriber", "EventTypes", "AggregateIds", "IsPaused"
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
           COALESCE(NULLIF((SELECT Count("CTE".*) < 2 FROM "CTE"), TRUE), FALSE)
         )
         ON CONFLICT ("EventSubscriber") DO UPDATE SET
         "EventTypes" = ${
           eventTypes != null
             ? escapeStr(JSON.stringify(eventTypes))
             : escapeStr('null')
         },
         "AggregateIds" = ${
           aggregateIds != null
             ? escapeStr(JSON.stringify(aggregateIds))
             : escapeStr('null')
         }
      `
        )
        break
      } catch (err) {
        if (!(err instanceof PassthroughError)) {
          throw err
        }
      }
    }

    const procedureSource = await loadProcedureSource()

    if (procedureSource != null && procedureSource.constructor === String) {
      const procedureNameAsId = escapeId(`PROC-${readModelName}`)
      while (true) {
        try {
          await inlineLedgerRunQuery(
            `CREATE OR REPLACE FUNCTION ${databaseNameAsId}.${procedureNameAsId}(input JSON) RETURNS JSON AS $$
              ${procedureSource}
              return __READ_MODEL_ENTRY__.default(input, ${JSON.stringify({
                schemaName,
                tablePrefix,
              })})
            $$ LANGUAGE plv8;
          `
          )

          break
        } catch (err) {
          if (!(err instanceof PassthroughError)) {
            break
          }
        }
      }
    }
  } finally {
    pool.activePassthrough = false
  }
}

export default subscribe
