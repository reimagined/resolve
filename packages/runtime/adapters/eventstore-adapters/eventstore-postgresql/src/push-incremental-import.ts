import { RESERVED_EVENT_SIZE } from './constants'
import type { AdapterPool } from './types'
import type { VersionlessEvent } from '@resolve-js/eventstore-base'

const pushIncrementalImport = async (
  {
    executeStatement,
    databaseName,
    eventsTableName,
    escapeId,
    escape,
  }: AdapterPool,
  events: VersionlessEvent[],
  importId: string
): Promise<void> => {
  try {
    const databaseNameAsId = escapeId(databaseName)
    const databaseNameAsStr = escape(databaseName)
    const incrementalImportTableAsId = escapeId(
      `${eventsTableName}-incremental-import`
    )
    const incrementalImportTableAsString = escape(
      `${eventsTableName}-incremental-import`
    )

    await executeStatement(
      `WITH "CTE" AS (
          SELECT 0 AS "Zero" WHERE (
            (SELECT 1 AS "IncrementalImportFailed")
          UNION ALL
            (SELECT 1 AS "IncrementalImportFailed"
            FROM "pg_catalog"."pg_class" "CLS"
            LEFT JOIN "pg_catalog"."pg_description" "DESC"
            ON "CLS"."oid" = "DESC"."objoid"
            LEFT JOIN "pg_catalog"."pg_namespace" "NS"
            ON "CLS"."relnamespace" = "NS"."oid"
            WHERE "DESC"."description" <>
            ${escape(
              `RESOLVE INCREMENTAL-IMPORT ${escape(importId)} OWNED TABLE`
            )}
            AND "CLS"."relname" = ${incrementalImportTableAsString}
            AND "NS"."nspname" = ${databaseNameAsStr}
            AND "CLS"."relkind" = 'r')
          ) = 1
        )
      INSERT INTO ${databaseNameAsId}.${incrementalImportTableAsId}(
        "timestamp", "aggregateId", "type", "payload", "eventSize"
      ) VALUES ${events
        .map((event) => {
          const serializedEvent = [
            `${+event.timestamp},`,
            `${escape(event.aggregateId)},`,
            `${escape(event.type)},`,
            escape(
              JSON.stringify(event.payload != null ? event.payload : null)
            ),
          ].join('')

          // TODO: Improve calculation byteLength depend on codepage and wide-characters
          const byteLength =
            Buffer.byteLength(serializedEvent) + RESERVED_EVENT_SIZE

          return `(${serializedEvent}, ${byteLength} + (SELECT "CTE"."Zero" FROM "CTE"))`
        })
        .join(',')}
      `
    )
  } catch (error) {
    if (
      error != null &&
      (error.message.indexOf('subquery used as an expression') > -1 ||
        /Table.*? does not exist$/i.test(error.message))
    ) {
      throw new Error(`Incremental importId=${importId} does not exist`)
    } else {
      throw error
    }
  }
}

export default pushIncrementalImport
