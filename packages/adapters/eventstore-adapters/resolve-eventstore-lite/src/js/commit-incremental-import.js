const commitIncrementalImport = async ({ database, eventsTableName, escapeId, escape }, importId) => {
  try {
    const incrementalImportTableAsId = escapeId(`${eventsTableName}-incremental-import`)
    const incrementalImportTableAsString = escape(`${eventsTableName}-incremental-import`)
    const eventsTableAsId = escapeId(eventsTableName)

    await database.exec(
      `BEGIN IMMEDIATE;
      SELECT ABS("CTE1"."IncrementalImportFailed") FROM (
        SELECT 0 AS "IncrementalImportFailed"
      UNION ALL
        SELECT -9223372036854775808 AS "IncrementalImportFailed"
        FROM "sqlite_master"
        WHERE "type" = 'table' AND 
        "name" = ${incrementalImportTableAsString} AND
        "sql" NOT LIKE ${escape(
        `%-- RESOLVE INCREMENTAL-IMPORT ${escape(`${importId}`)} OWNED TABLE%`
      )}
      ) "CTE1";
      
      SELECT ABS("CTE2"."IncrementalImportFailed") FROM (
        SELECT 0 AS "IncrementalImportFailed"
      UNION ALL
        SELECT -9223372036854775808 AS "IncrementalImportFailed"
        FROM ${eventsTableAsId}
        WHERE ${eventsTableAsId}."timestamp" > (
          SELECT MIN(${incrementalImportTableAsId}."timestamp") FROM ${incrementalImportTableAsId}
        )
        LIMIT 2
      )}
      ) "CTE2";
      
      DELETE FROM ${incrementalImportTableAsId} WHERE "rowid" NOT IN (
        SELECT "MaybeEqualEvents"."rowidx" FROM (
          SELECT "A"."payload" AS "payloadA", "B"."payload" AS "payloadB", "A"."rowid" AS "rowidx"
          FROM ${incrementalImportTableAsId} "A" LEFT JOIN ${eventsTableAsId} "B" ON
          "A"."timestamp" = "B"."timestamp" AND
          "A"."aggregateId" = "B"."aggregateId" AND
          "A"."type" = "B"."type"
        ) "MaybeEqualEvents"
        WHERE "MaybeEqualEvents"."payloadA" = "MaybeEqualEvents"."payloadB"
      );
      
      WITH "CTE3" AS (
        SELECT ROW_NUMBER() OVER (ORDER BY "timestamp", "type", "aggregateId") - 1 AS "sortedIdx",
        "rowid" as "rowIdx"
        FROM ${incrementalImportTableAsId}
        ORDER BY "timestamp"
      )
      UPDATE ${incrementalImportTableAsId} SET "sortedIdx" = (
        SELECT "CTE3"."sortedIdx" FROM "CTE3"
        WHERE "CTE3"."rowIdx" = ${incrementalImportTableAsId}."rowid"
      );
      
      WITH "CTE4" AS (
        SELECT "threadId", MAX("threadCounter") AS "threadCounter"  
        FROM ${eventsTableAsId}
        GROUP BY "threadId"
      )
      UPDATE ${incrementalImportTableAsId} 
      SET "threadId" = "sortedIdx" % 256,
      "threadCounter" = (
        SELECT "CTE4"."threadCounter" FROM "CTE4"
        WHERE "CTE4"."threadId" = ${incrementalImportTableAsId}."sortedIdx" % 256
      ) + 1 + FLOOR("sortedIdx" / 256);
      
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
        SELECT ROW_NUMBER() OVER (PARTITION BY "aggregateId" ORDER BY "timestamp", "type", "aggregateId") - 1 AS "increment",
        "rowid" as "rowIdx"
        FROM ${incrementalImportTableAsId}
        ORDER BY "timestamp"
      )
      UPDATE ${incrementalImportTableAsId} 
      SET "aggregateVersion" = "aggregateVersion" + (
        SELECT "CTE6"."increment" FROM "CTE6" 
        WHERE "CTE6"."rowIdx" = ${incrementalImportTableAsId}."rowid"
      );
           
      COMMIT;
      `
    )
  } catch(error) {
    try {
      await database.exec(`ROLLBACK;`)
    } catch(e) {}
    if (error != null && (error.message === 'SQLITE_ERROR: integer overflow' || /^SQLITE_ERROR:.*? not exists$/.test(error.message))) {
      throw new Error(`Incremental importId=${importId} does not exist`)
    } else {
      throw error
    }
  }

}

export default commitIncrementalImport
