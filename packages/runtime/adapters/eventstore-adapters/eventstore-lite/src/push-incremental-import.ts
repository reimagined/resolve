import type { AdapterPool } from './types'
import { InputEvent, THREAD_COUNT } from '@resolve-js/eventstore-base'
import isIntegerOverflowError from './integer-overflow-error'

const pushIncrementalImport = async (
  { executeQuery, eventsTableName, escapeId, escape }: AdapterPool,
  events: InputEvent[],
  importId: string
): Promise<void> => {
  try {
    const incrementalImportTableAsId = escapeId(
      `${eventsTableName}-incremental-import`
    )
    const incrementalImportTableAsString = escape(
      `${eventsTableName}-incremental-import`
    )

    await executeQuery(
      `BEGIN IMMEDIATE;
      SELECT ABS("CTE"."IncrementalImportFailed") FROM (
        SELECT 0 AS "IncrementalImportFailed"
      UNION ALL
        SELECT -9223372036854775808 AS "IncrementalImportFailed"
        FROM "sqlite_master"
        WHERE "type" = 'table' AND 
        "name" = ${incrementalImportTableAsString} AND
        "sql" NOT LIKE ${escape(
          `%-- RESOLVE INCREMENTAL-IMPORT ${escape(importId)} OWNED TABLE%`
        )}
      ) CTE;
      
      INSERT INTO ${incrementalImportTableAsId}(
        "timestamp", "aggregateId", "type", "payload", "threadId"
      ) VALUES ${events
        .map(
          (event) => `(${+event.timestamp}, ${escape(
            event.aggregateId
          )}, ${escape(event.type)}, 
      ${
        event.payload != null
          ? escape(JSON.stringify(event.payload))
          : escape('null')
      }, ${event.timestamp % THREAD_COUNT})`
        )
        .join(',')};
    
    COMMIT;
      `
    )
  } catch (error) {
    try {
      await executeQuery(`ROLLBACK;`)
    } catch (e) {}
    if (
      error != null &&
      (isIntegerOverflowError(error.message) ||
        /^.*? not exists$/.test(error.message))
    ) {
      throw new Error(`Incremental importId=${importId} does not exist`)
    } else {
      throw error
    }
  }
}

export default pushIncrementalImport
