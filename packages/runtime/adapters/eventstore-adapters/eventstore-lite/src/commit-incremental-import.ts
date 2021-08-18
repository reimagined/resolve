import { AdapterPool } from './types'

const commitIncrementalImport = async (
  { database, eventsTableName, escapeId, escape }: AdapterPool,
  importId: string
): Promise<void> => {
  const incrementalImportTableAsId = escapeId(
    `${eventsTableName}-incremental-import`
  )
  const incrementalImportTableAsString = escape(
    `${eventsTableName}-incremental-import`
  )
  const eventsTableAsId = escapeId(eventsTableName)

  try {
    await database.exec(`BEGIN IMMEDIATE;
      SELECT ABS("CTE1"."IncrementalImportFailed") FROM (
        SELECT 0 AS "IncrementalImportFailed"
      UNION ALL
        SELECT -9223372036854775808 AS "IncrementalImportFailed"
        FROM "sqlite_master"
        WHERE "type" = 'table' AND 
        "name" = ${incrementalImportTableAsString} AND
        "sql" NOT LIKE ${escape(
          `%-- RESOLVE INCREMENTAL-IMPORT ${escape(importId)} OWNED TABLE%`
        )}
      ) "CTE1";
      
      DELETE FROM ${incrementalImportTableAsId} WHERE "rowid" IN (
        SELECT "MaybeEqualEvents"."rowIdX" FROM (
          SELECT "A"."payload" AS "payloadA", "B"."payload" AS "payloadB", "A"."rowid" AS "rowIdX"
          FROM ${incrementalImportTableAsId} "A" LEFT JOIN ${eventsTableAsId} "B" ON
          "A"."timestamp" = "B"."timestamp" AND
          "A"."aggregateId" = "B"."aggregateId" AND
          "A"."type" = "B"."type"
        ) "MaybeEqualEvents"
        WHERE "MaybeEqualEvents"."payloadA" = "MaybeEqualEvents"."payloadB"
      );
      
      SELECT ABS("CTE2"."IncrementalImportFailed") FROM (
      SELECT 0 AS "IncrementalImportFailed"
      UNION ALL
        SELECT -9223372036854775808 AS "IncrementalImportFailed"
        FROM ${eventsTableAsId}
        WHERE ${eventsTableAsId}."timestamp" > (
          SELECT MIN(${incrementalImportTableAsId}."timestamp") FROM ${incrementalImportTableAsId}
        )
        LIMIT 2
      ) "CTE2";
      
      
      WITH "CTE3" AS (
        SELECT ROW_NUMBER() OVER (PARTITION BY "threadId" ORDER BY "timestamp", "rowid") - 1 AS "sortedIdx",
        "rowid" as "rowIdX"
        FROM ${incrementalImportTableAsId}
        ORDER BY "timestamp"
      ),
      "CTE4" AS (
        SELECT "threadId", MAX("threadCounter") AS "threadCounter"  
        FROM ${eventsTableAsId}
        GROUP BY "threadId"
      )
      UPDATE ${incrementalImportTableAsId} 
      SET "threadCounter" = COALESCE((
        SELECT "CTE4"."threadCounter" FROM "CTE4"
        WHERE "CTE4"."threadId" = ${incrementalImportTableAsId}."timestamp" % 256
      ), -1) + 1 + (SELECT "sortedIdx" FROM "CTE3" WHERE "CTE3"."rowIdX" = ${incrementalImportTableAsId}."rowid");
      
      WITH "CTE5" AS (
        SELECT MAX("aggregateVersion") AS "aggregateVersion", "aggregateId"  
        FROM ${eventsTableAsId}
        GROUP BY "aggregateId"
      ) 
      UPDATE ${incrementalImportTableAsId} 
      SET "aggregateVersion" = COALESCE((
        SELECT "CTE5"."aggregateVersion" FROM "CTE5" 
        WHERE "CTE5"."aggregateId" = ${incrementalImportTableAsId}."aggregateId"
      ), 0) + 1;
      
      WITH "CTE6" AS (
        SELECT ROW_NUMBER() OVER (PARTITION BY "aggregateId" ORDER BY "timestamp", "rowid") - 1 AS "increment",
        "rowid" as "rowIdX"
        FROM ${incrementalImportTableAsId}
        ORDER BY "timestamp"
      )
      UPDATE ${incrementalImportTableAsId} 
      SET "aggregateVersion" = "aggregateVersion" + (
        SELECT "CTE6"."increment" FROM "CTE6" 
        WHERE "CTE6"."rowIdX" = ${incrementalImportTableAsId}."rowid"
      );
      
      INSERT INTO ${eventsTableAsId}(
        "threadId",
        "threadCounter",
        "timestamp",
        "aggregateId",
        "aggregateVersion",
        "type",
        "payload"
      )
      SELECT "threadId",
        "threadCounter",
        "timestamp",
        "aggregateId",
        "aggregateVersion",
        "type",
        "payload"
      FROM ${incrementalImportTableAsId};
           
      COMMIT;
      `)
  } catch (error) {
    try {
      await database.exec(`ROLLBACK;`)
    } catch (e) {}
    if (
      error != null &&
      (error.message === 'SQLITE_ERROR: integer overflow' ||
        /^SQLITE_ERROR:.*? not exists$/.test(error.message))
    ) {
      throw new Error(
        `Either event batch has timestamps from the past or incremental importId=${importId} does not exist`
      )
    } else {
      throw error
    }
  } finally {
    await database.exec(`DROP TABLE IF EXISTS ${incrementalImportTableAsId};`)
  }
}

export default commitIncrementalImport
