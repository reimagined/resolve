const commitIncrementalImport = async (
  { executeStatement, databaseName, eventsTableName, escapeId, escape },
  importId
) => {
  const incrementalImportTableAsId = escapeId(
    `${eventsTableName}-incremental-import`
  )
  const incrementalImportTableAsString = escape(
    `${eventsTableName}-incremental-import`
  )
  const eventsTableAsId = escapeId(eventsTableName)
  const databaseNameAsId = escapeId(databaseName)
  const databaseNameAsStr = escape(databaseName)

  try {
  const sql = `
      WITH "CTE0" AS (
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
          ${escape(`RESOLVE INCREMENTAL-IMPORT ${escape(importId)} OWNED TABLE`)}
          AND "CLS"."relname" = ${incrementalImportTableAsString}
          AND "NS"."nspname" = ${databaseNameAsStr}
          AND "CLS"."relkind" = 'r')
        ) = 1
      ),
      "CTE1" AS (
        SELECT 0 AS "Zero" WHERE (
          (SELECT 1 AS "IncrementalImportFailed")
        UNION ALL
          (SELECT 1 AS "IncrementalImportFailed"
          FROM ${databaseNameAsId}.${eventsTableAsId}
          WHERE ${databaseNameAsId}.${eventsTableAsId}."timestamp" > (
            SELECT MIN(${databaseNameAsId}.${incrementalImportTableAsId}."timestamp") +
            (SELECT "CTE0"."Zero" FROM "CTE0")
            FROM ${databaseNameAsId}.${incrementalImportTableAsId}
          )
          LIMIT 2)    
        ) = 1
      ),
      "CTE2A" AS (
        DELETE FROM ${databaseNameAsId}.${incrementalImportTableAsId} WHERE "rowid" IN (
          SELECT "MaybeEqualEvents"."rowIdX" FROM (
            SELECT "A"."payload" AS "payloadA", "B"."payload" AS "payloadB", "A"."rowid" AS "rowIdX"
            FROM ${databaseNameAsId}.${incrementalImportTableAsId} "A" LEFT JOIN ${databaseNameAsId}.${eventsTableAsId} "B" ON
            "A"."timestamp" = "B"."timestamp" AND
            "A"."aggregateId" = "B"."aggregateId" AND
            "A"."type" = "B"."type"
          ) "MaybeEqualEvents"
          WHERE "MaybeEqualEvents"."payloadA" = "MaybeEqualEvents"."payloadB"
          AND (SELECT "CTE1"."Zero" FROM "CTE1") = 0
        )
        RETURNING *
      ),
      "CTE2B" AS (
        SELECT LEAST(COUNT("CTE2A".*), 0) AS "Zero" FROM "CTE2A"
      ),
      "CTE3A" AS (
        SELECT ROW_NUMBER() OVER (ORDER BY "timestamp", "rowid") - 1 AS "sortedIdx",
        "rowid" as "rowIdX"
        FROM ${databaseNameAsId}.${incrementalImportTableAsId}
        WHERE (SELECT "CTE2B"."Zero" FROM "CTE2B") = 0
        ORDER BY "timestamp"
      ),
      "CTE3B" AS (
        UPDATE ${databaseNameAsId}.${incrementalImportTableAsId} SET "sortedIdx" = (
          SELECT "CTE3A"."sortedIdx" FROM "CTE3A"
          WHERE "CTE3A"."rowIdX" = ${databaseNameAsId}.${incrementalImportTableAsId}."rowid"
        )
        RETURNING *
      ),
      "CTE3C" AS (
        SELECT LEAST(COUNT("CTE3B".*), 0) AS "Zero" FROM "CTE3B"
      ),      
      "CTE4A" AS (
        SELECT "threadId", MAX("threadCounter") AS "threadCounter"  
        FROM ${databaseNameAsId}.${eventsTableAsId}
        WHERE (SELECT "CTE3C"."Zero" FROM "CTE3C") = 0
        GROUP BY "threadId"
      ),
      "CTE4B" AS (
        UPDATE ${databaseNameAsId}.${incrementalImportTableAsId} 
        SET "threadId" = "sortedIdx" % 256,
        "threadCounter" = COALESCE((
          SELECT "CTE4A"."threadCounter" FROM "CTE4A"
          WHERE "CTE4A"."threadId" = ${databaseNameAsId}.${incrementalImportTableAsId}."sortedIdx" % 256
        ), -1) + 1 + FLOOR("sortedIdx" / 256)
        RETURNING *
      ),
      "CTE4C" AS (
        SELECT LEAST(COUNT("CTE4B".*), 0) AS "Zero" FROM "CTE4B"
      ),
      "CTE5A" AS (
        SELECT MAX("aggregateVersion") AS "aggregateVersion", "aggregateId"  
        FROM ${databaseNameAsId}.${eventsTableAsId}
        WHERE (SELECT "CTE4C"."Zero" FROM "CTE4C") = 0
        GROUP BY "aggregateId"
      ),
      "CTE5B" AS (
        UPDATE ${databaseNameAsId}.${incrementalImportTableAsId} 
        SET "aggregateVersion" = COALESCE((
          SELECT "CTE5A"."aggregateVersion" FROM "CTE5A" 
          WHERE "CTE5A"."aggregateId" = ${databaseNameAsId}.${incrementalImportTableAsId}."aggregateId"
        ), 0) + 1
        RETURNING *
      ),
      "CTE5C" AS (
        SELECT LEAST(COUNT("CTE5B".*), 0) AS "Zero" FROM "CTE5B"
      ),
      "CTE6A" AS (
        SELECT ROW_NUMBER() OVER (PARTITION BY "aggregateId" ORDER BY "timestamp", "rowid") - 1 AS "increment",
        "rowid" as "rowIdX"
        FROM ${databaseNameAsId}.${incrementalImportTableAsId}
        WHERE (SELECT "CTE5C"."Zero" FROM "CTE5C") = 0
        ORDER BY "timestamp"
      ),
      "CTE6B" AS (
        UPDATE ${databaseNameAsId}.${incrementalImportTableAsId} 
        SET "aggregateVersion" = "aggregateVersion" + (
          SELECT "CTE6A"."increment" FROM "CTE6A" 
          WHERE "CTE6A"."rowIdX" = ${databaseNameAsId}.${incrementalImportTableAsId}."rowid"
        )
        RETURNING *
      ),
      "CTE6C" AS (
        SELECT LEAST(COUNT("CTE6B".*), 0) AS "Zero" FROM "CTE6B"
      )
      INSERT INTO ${databaseNameAsId}.${eventsTableAsId}(
        "threadId",
        "threadCounter",
        "timestamp",
        "aggregateId",
        "aggregateVersion",
        "type",
        "payload",
        "eventSize"
      )
      SELECT "threadId",
        "threadCounter",
        "timestamp",
        "aggregateId",
        "aggregateVersion",
        "type",
        "payload",
        "eventSize"
      FROM ${databaseNameAsId}.${incrementalImportTableAsId}
      WHERE (SELECT "CTE6C"."Zero" FROM "CTE6C") = 0
      ORDER BY "sortedIdx"  
      `

    console.log(sql)
    await executeStatement(sql)

  } catch (error) {
    if (error != null && /Table.*? does not exist$/i.test(error.message)) {
      throw new Error(`Either event batch has timestamps from the past nor incremental importId=${importId} does not exist`)
    } else {
      throw error
    }
  } finally {
    try {
      await database.exec(`DROP TABLE ${databaseNameAsId}.${incrementalImportTableAsId};`)
    } catch (e) {}
  }
}

export default commitIncrementalImport
