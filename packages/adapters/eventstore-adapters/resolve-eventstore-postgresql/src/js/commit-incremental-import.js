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
      WITH "ValidateImportId" AS (
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
      "ValidateTimestamps" AS (
        SELECT 0 AS "Zero" WHERE (
          (SELECT 1 AS "IncrementalImportFailed")
        UNION ALL
          (SELECT 1 AS "IncrementalImportFailed"
          FROM ${databaseNameAsId}.${eventsTableAsId}
          WHERE ${databaseNameAsId}.${eventsTableAsId}."timestamp" > (
            SELECT MIN(${databaseNameAsId}.${incrementalImportTableAsId}."timestamp") +
            (SELECT "ValidateImportId"."Zero" FROM "ValidateImportId")
            FROM ${databaseNameAsId}.${incrementalImportTableAsId}
          )
          LIMIT 2)    
        ) = 1
      ),
      "OriginalUniqueEvents" AS (
        SELECT * FROM ${databaseNameAsId}.${incrementalImportTableAsId} WHERE "rowid" NOT IN (
          SELECT "MaybeEqualEvents"."rowid" FROM (
            SELECT "A"."payload" AS "payloadA", "B"."payload" AS "payloadB", "A"."rowid" AS "rowid"
            FROM ${databaseNameAsId}.${incrementalImportTableAsId} "A" LEFT JOIN ${databaseNameAsId}.${eventsTableAsId} "B" ON
            "A"."timestamp" = "B"."timestamp" AND
            "A"."aggregateId" = "B"."aggregateId" AND
            "A"."type" = "B"."type"
          ) "MaybeEqualEvents"
          WHERE "MaybeEqualEvents"."payloadA" = "MaybeEqualEvents"."payloadB"
          AND (SELECT "ValidateTimestamps"."Zero" FROM "ValidateTimestamps") = 0
        )
      ),
      "EnumeratedUniqueEvents" AS (
        SELECT ROW_NUMBER() OVER (ORDER BY "OriginalUniqueEvents"."timestamp", "OriginalUniqueEvents"."rowid") - 1 AS "sortedIdx",
        "OriginalUniqueEvents"."rowid" as "rowid"
        FROM "OriginalUniqueEvents"
        ORDER BY "OriginalUniqueEvents"."timestamp"
      ),
      "ThreadTails" AS (
        SELECT "threadId", MAX("threadCounter") AS "threadCounter"  
        FROM ${databaseNameAsId}.${eventsTableAsId}
        GROUP BY "threadId"
      ),
      "ThreadHeads" AS (
        SELECT "EnumeratedUniqueEvents"."sortedIdx" AS "sortedIdx",
        "EnumeratedUniqueEvents"."rowid" AS "rowid",
        "EnumeratedUniqueEvents"."sortedIdx" % 256 AS "threadId",
        COALESCE((
          SELECT "ThreadTails"."threadCounter" FROM "ThreadTails"
          WHERE "ThreadTails"."threadId" = "EnumeratedUniqueEvents"."sortedIdx" % 256
        ), -1) + 1 + FLOOR("EnumeratedUniqueEvents"."sortedIdx" / 256) AS "threadCounter"
        FROM "EnumeratedUniqueEvents"
      ),
      "AggregateTails" AS (
        SELECT MAX("aggregateVersion") AS "aggregateVersion", "aggregateId"  
        FROM ${databaseNameAsId}.${eventsTableAsId}
        GROUP BY "aggregateId"
      ),
      "OriginalAggregateHeads" AS (
        SELECT "EnumeratedUniqueEvents"."sortedIdx" AS "sortedIdx",
        "EnumeratedUniqueEvents"."rowid" AS "rowid",
        "OriginalUniqueEvents"."aggregateId" AS "aggregateId",
        "OriginalUniqueEvents"."timestamp" AS "timestamp",
         COALESCE((
          SELECT "AggregateTails"."aggregateVersion" FROM "AggregateTails" 
          WHERE "AggregateTails"."aggregateId" = "OriginalUniqueEvents"."aggregateId"
        ), 0) + 1 AS "aggregateVersion" 
        FROM "OriginalUniqueEvents" LEFT JOIN "EnumeratedUniqueEvents"
        ON "OriginalUniqueEvents"."rowid" = "EnumeratedUniqueEvents"."rowid"
      ),
      "IncrementedAggregateHeads" AS (
        SELECT ROW_NUMBER() OVER (PARTITION BY "OriginalAggregateHeads"."aggregateId" ORDER BY "OriginalAggregateHeads"."timestamp", "OriginalAggregateHeads"."rowid") - 1 +  
        "OriginalAggregateHeads"."aggregateVersion" AS "aggregateVersion",
        "OriginalAggregateHeads"."rowid" as "rowid"
        FROM "OriginalAggregateHeads"
        ORDER BY "OriginalAggregateHeads"."sortedIdx"
      ),
      "InsertionTable" AS (
        SELECT "ThreadHeads"."threadId" AS "threadId", "ThreadHeads"."threadCounter" AS "threadCounter",
        "OriginalUniqueEvents"."timestamp" AS "timestamp", "OriginalUniqueEvents"."aggregateId" AS "aggregateId",
        "IncrementedAggregateHeads"."aggregateVersion" AS "aggregateVersion",
        "OriginalUniqueEvents"."type" AS "type", "OriginalUniqueEvents"."payload" AS "payload",
        "OriginalUniqueEvents"."eventSize" AS "eventSize"
        FROM "OriginalUniqueEvents"
        LEFT JOIN "ThreadHeads" ON "OriginalUniqueEvents"."rowid" = "ThreadHeads"."rowid"
        LEFT JOIN "IncrementedAggregateHeads" ON "OriginalUniqueEvents"."rowid" = "IncrementedAggregateHeads"."rowid"
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
      SELECT * FROM "InsertionTable"
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
