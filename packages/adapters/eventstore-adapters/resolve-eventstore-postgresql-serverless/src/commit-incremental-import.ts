import { AdapterPool } from './types'

const commitIncrementalImport = async (
  {
    executeStatement,
    databaseName,
    eventsTableName,
    escapeId,
    escape,
  }: AdapterPool,
  importId: string,
  validateAfterCommit: any
): Promise<void> => {
  const incrementalImportTableAsId = escapeId(
    `${eventsTableName}-incremental-import`
  )
  const incrementalImportTableAsString = escape(
    `${eventsTableName}-incremental-import`
  )
  const threadsTableAsId = escapeId(`${eventsTableName}-threads`)
  const eventsTableAsId = escapeId(eventsTableName)
  const databaseNameAsId = escapeId(databaseName)
  const databaseNameAsStr = escape(databaseName)

  try {
    await executeStatement(`
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
          ${escape(
            `RESOLVE INCREMENTAL-IMPORT ${escape(importId)} OWNED TABLE`
          )}
          AND "CLS"."relname" = ${incrementalImportTableAsString}
          AND "NS"."nspname" = ${databaseNameAsStr}
          AND "CLS"."relkind" = 'r')
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
          AND (SELECT "ValidateImportId"."Zero" FROM "ValidateImportId") = 0
        )
      ),
      "ValidateTimestamps" AS (
        SELECT 0 AS "Zero" WHERE (
          (SELECT 1 AS "IncrementalImportFailed")
        UNION ALL
          (SELECT 1 AS "IncrementalImportFailed"
          FROM ${databaseNameAsId}.${eventsTableAsId}
          WHERE ${databaseNameAsId}.${eventsTableAsId}."timestamp" > (
            SELECT MIN("OriginalUniqueEvents"."timestamp")
            FROM "OriginalUniqueEvents"
          )
          LIMIT 2)    
        ) = 1
      ),
      "EnumeratedUniqueEvents" AS (
        SELECT ROW_NUMBER() OVER (ORDER BY "OriginalUniqueEvents"."timestamp", "OriginalUniqueEvents"."rowid") - 1 AS "sortedIdx",
        "OriginalUniqueEvents"."rowid" as "rowid"
        FROM "OriginalUniqueEvents"
        WHERE (SELECT "ValidateTimestamps"."Zero" FROM "ValidateTimestamps") = 0
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
      ),
      "ResultTable" AS (
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
      )
      UPDATE ${databaseNameAsId}.${threadsTableAsId} 
      SET "threadCounter" = GREATEST(
        ${databaseNameAsId}.${threadsTableAsId}."threadCounter",
        COALESCE((SELECT MAX("InsertionTable"."threadCounter") AS "threadCounter"
        FROM "InsertionTable"
        WHERE "InsertionTable"."threadId" = ${databaseNameAsId}.${threadsTableAsId}."threadId"
        ) + 1, 0)
      )
    `)

    if (validateAfterCommit != null && validateAfterCommit === true) {
      const realThreadIdCounters = (
        await executeStatement(
          `SELECT "threadId", MAX("threadCounter") AS "threadCounter"
        FROM ${databaseNameAsId}.${eventsTableAsId}
        GROUP BY "threadId"
        `
        )
      ).map(({ threadId, threadCounter }) => ({
        threadId: !isNaN(+threadId) ? +threadId : Symbol('BAD_THREAD_ID'),
        threadCounter: !isNaN(+threadCounter)
          ? +threadCounter
          : Symbol('BAD_THREAD_COUNTER'),
      }))

      const predictedThreadIdCounters = (
        await executeStatement(
          `SELECT "threadId", "threadCounter"
        FROM ${databaseNameAsId}.${threadsTableAsId}`
        )
      ).map(({ threadId, threadCounter }) => ({
        threadId: !isNaN(+threadId) ? +threadId : Symbol('BAD_THREAD_ID'),
        threadCounter: !isNaN(+threadCounter)
          ? +threadCounter
          : Symbol('BAD_THREAD_COUNTER'),
      }))

      const validationMapReal = new Map()
      const validationMapPredicted = new Map()

      for (const { threadId, threadCounter } of realThreadIdCounters) {
        validationMapReal.set(threadId, threadCounter)
      }
      for (const { threadId, threadCounter } of predictedThreadIdCounters) {
        validationMapPredicted.set(threadId, threadCounter)
      }

      const validationErrors = []

      for (const { threadId, threadCounter } of realThreadIdCounters) {
        if (
          validationMapPredicted.get(threadId) !==
          Number(threadCounter) + 1
        ) {
          validationErrors.push(
            new Error(
              `Real -> Predicted threadCounter mismatch ${String(
                threadId
              )} ${String(threadCounter)} ${validationMapPredicted.get(
                threadId
              )}`
            )
          )
        }
      }
      for (const { threadId, threadCounter } of predictedThreadIdCounters) {
        if (
          validationMapReal.get(threadId) !== Number(threadCounter) - 1 &&
          validationMapReal.get(threadId) != null
        ) {
          validationErrors.push(
            new Error(
              `Predicted -> Real threadCounter mismatch ${String(
                threadId
              )} ${String(threadCounter)} ${validationMapReal.get(threadId)}`
            )
          )
        }
      }

      if (validationErrors.length > 0) {
        const compositeError = new Error(
          validationErrors.map(({ message }) => message).join('\n')
        )
        compositeError.stack = validationErrors
          .map(({ stack }) => stack)
          .join('\n')
        throw compositeError
      }
    } else if (validateAfterCommit != null) {
      throw new Error('Bad argument for "validateAfterCommit"')
    }
  } catch (error) {
    if (
      error != null &&
      (/Table.*? does not exist$/i.test(error.message) ||
        /subquery used as an expression/i.test(error.message))
    ) {
      throw new Error(
        `Either event batch has timestamps from the past nor incremental importId=${importId} does not exist`
      )
    } else {
      throw error
    }
  } finally {
    await executeStatement(
      `DROP TABLE IF EXISTS ${databaseNameAsId}.${incrementalImportTableAsId};`
    )
  }
}

export default commitIncrementalImport
