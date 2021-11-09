import { ER_NO_SUCH_TABLE, ER_SUBQUERY_NO_1_ROW } from './constants'
import { AdapterPool } from './types'

const commitIncrementalImport = async (
  { eventsTableName, database, escapeId, escape, query }: AdapterPool,
  importId: string,
  validateAfterCommit: any
): Promise<void> => {
  const incrementalImportTableAsId: string = escapeId(
    `${eventsTableName}-incremental-import`
  )
  const incrementalImportTableAsString: string = escape(
    `${eventsTableName}-incremental-import`
  )
  const threadsTableAsId: string = escapeId(`${eventsTableName}-threads`)
  const eventsTableAsId: string = escapeId(eventsTableName)

  const databaseNameAsString: string = escape(database)

  try {
    await query(`START TRANSACTION;
      SELECT 1 FROM \`information_schema\`.\`tables\`
      WHERE (
        SELECT 0 AS \`Defunct\`
       UNION ALL
         SELECT 0 AS \`Defunct\`
         FROM \`information_schema\`.\`tables\` \`INF\`
         WHERE \`INF\`.\`table_schema\` = ${databaseNameAsString}
         AND \`INF\`.\`table_name\` = ${incrementalImportTableAsString}
         AND \`INF\`.\`table_comment\` <> ${escape(
           `RESOLVE INCREMENTAL-IMPORT ${escape(importId)} OWNED TABLE`
         )}
       ) = 0;

      DELETE FROM ${incrementalImportTableAsId} WHERE \`rowid\` IN (
        SELECT \`MaybeEqualEvents\`.\`rowIdX\` FROM (
          SELECT \`A\`.\`payload\` AS \`payloadA\`, \`B\`.\`payload\` AS \`payloadB\`, \`A\`.\`rowid\` AS \`rowIdX\`
          FROM ${incrementalImportTableAsId} \`A\` LEFT JOIN ${eventsTableAsId} \`B\` ON
          \`A\`.\`timestamp\` = \`B\`.\`timestamp\` AND
          \`A\`.\`aggregateId\` = \`B\`.\`aggregateId\` AND
          \`A\`.\`type\` = \`B\`.\`type\`
        ) \`MaybeEqualEvents\`
        WHERE \`MaybeEqualEvents\`.\`payloadA\` = \`MaybeEqualEvents\`.\`payloadB\`
      );
       
      SELECT 1 FROM \`information_schema\`.\`tables\`
      WHERE (
         SELECT 0 AS \`Defunct\`
       UNION ALL
         SELECT 0 AS \`Defunct\`
         FROM ${eventsTableAsId}
         WHERE ${eventsTableAsId}.\`timestamp\` > (
           SELECT MIN(${incrementalImportTableAsId}.\`timestamp\`)
           FROM ${incrementalImportTableAsId}
         )
       ) = 0;
           
      WITH \`UpdateSortedIndexes\` AS (
        SELECT ROW_NUMBER() OVER (ORDER BY \`timestamp\`, \`rowid\`) - 1 AS \`sortedIdx\`,
        \`rowid\` as \`rowIdX\`
        FROM ${incrementalImportTableAsId}
        ORDER BY \`timestamp\`
      )
      UPDATE ${incrementalImportTableAsId} SET \`sortedIdx\` = (
        SELECT \`UpdateSortedIndexes\`.\`sortedIdx\` FROM \`UpdateSortedIndexes\`
        WHERE \`UpdateSortedIndexes\`.\`rowIdX\` = ${incrementalImportTableAsId}.\`rowid\`
      );
      
      WITH \`UpdateThreadCounters\` AS (
        SELECT \`threadId\`, MAX(\`threadCounter\`) AS \`threadCounter\`  
        FROM ${eventsTableAsId}
        GROUP BY \`threadId\`
      )
      UPDATE ${incrementalImportTableAsId} 
      SET \`threadId\` = \`sortedIdx\` % 256,
      \`threadCounter\` = COALESCE((
        SELECT \`UpdateThreadCounters\`.\`threadCounter\` FROM \`UpdateThreadCounters\`
        WHERE \`UpdateThreadCounters\`.\`threadId\` = ${incrementalImportTableAsId}.\`sortedIdx\` % 256
      ), -1) + 1 + FLOOR(${incrementalImportTableAsId}.\`sortedIdx\` / 256);
      
      WITH \`UpdateMinAggregates\` AS (
        SELECT MAX(\`aggregateVersion\`) AS \`aggregateVersion\`, \`aggregateId\`  
        FROM ${eventsTableAsId}
        GROUP BY \`aggregateId\`
      ) 
      UPDATE ${incrementalImportTableAsId} 
      SET \`aggregateVersion\` = COALESCE((
        SELECT \`UpdateMinAggregates\`.\`aggregateVersion\` FROM \`UpdateMinAggregates\` 
        WHERE \`UpdateMinAggregates\`.\`aggregateId\` = ${incrementalImportTableAsId}.\`aggregateId\`
      ), 0) + 1;
      
      WITH \`UpdateMaxAggregates\` AS (
        SELECT ROW_NUMBER() OVER (PARTITION BY \`aggregateId\` ORDER BY \`timestamp\`, \`rowid\`) - 1 AS \`increment\`,
        \`rowid\` as \`rowIdX\`
        FROM ${incrementalImportTableAsId}
        ORDER BY \`timestamp\`
      )
      UPDATE ${incrementalImportTableAsId} 
      SET \`aggregateVersion\` = \`aggregateVersion\` + (
        SELECT \`UpdateMaxAggregates\`.\`increment\` FROM \`UpdateMaxAggregates\` 
        WHERE \`UpdateMaxAggregates\`.\`rowIdX\` = ${incrementalImportTableAsId}.\`rowid\`
      );
      
      INSERT INTO ${eventsTableAsId}(
        \`threadId\`,
        \`threadCounter\`,
        \`timestamp\`,
        \`aggregateId\`,
        \`aggregateVersion\`,
        \`type\`,
        \`payload\`
      )
      SELECT \`threadId\`,
        \`threadCounter\`,
        \`timestamp\`,
        \`aggregateId\`,
        \`aggregateVersion\`,
        \`type\`,
        \`payload\`
      FROM ${incrementalImportTableAsId}
      ORDER BY \`sortedIdx\`;
      
      UPDATE ${threadsTableAsId} 
      SET \`threadCounter\` = GREATEST(
        ${threadsTableAsId}.\`threadCounter\`,
        COALESCE((SELECT MAX(${incrementalImportTableAsId}.\`threadCounter\`) AS \`threadCounter\`
        FROM ${incrementalImportTableAsId}
        WHERE ${incrementalImportTableAsId}.\`threadId\` = ${threadsTableAsId}.\`threadId\`
        ) + 1, 0)
      );
           
      COMMIT;
      `)

    if (validateAfterCommit != null && validateAfterCommit === true) {
      const realThreadIdCounters: any = (
        await query(
          `SELECT \`threadId\`, MAX(\`threadCounter\`) AS \`threadCounter\`
        FROM ${eventsTableAsId}
        GROUP BY \`threadId\`
        `
        )
      )[0].map(({ threadId, threadCounter }: any) => ({
        threadId: !isNaN(+threadId) ? +threadId : Symbol('BAD_THREAD_ID'),
        threadCounter: !isNaN(+threadCounter)
          ? +threadCounter
          : Symbol('BAD_THREAD_COUNTER'),
      }))

      const predictedThreadIdCounters: any = (
        await query(
          `SELECT \`threadId\`, \`threadCounter\` FROM ${threadsTableAsId}`
        )
      )[0].map(({ threadId, threadCounter }: any) => ({
        threadId: !isNaN(+threadId) ? +threadId : Symbol('BAD_THREAD_ID'),
        threadCounter: !isNaN(+threadCounter)
          ? +threadCounter
          : Symbol('BAD_THREAD_COUNTER'),
      }))

      const validationMapReal: Map<any, any> = new Map()
      const validationMapPredicted: Map<any, any> = new Map()

      for (const { threadId, threadCounter } of realThreadIdCounters) {
        validationMapReal.set(threadId, threadCounter)
      }
      for (const { threadId, threadCounter } of predictedThreadIdCounters) {
        validationMapPredicted.set(threadId, threadCounter)
      }

      const validationErrors: Error[] = []

      for (const { threadId, threadCounter } of realThreadIdCounters) {
        if (validationMapPredicted.get(threadId) !== threadCounter + 1) {
          validationErrors.push(
            new Error(
              `Real -> Predicted threadCounter mismatch ${threadId} ${threadCounter} ${validationMapPredicted.get(
                threadId
              )}`
            )
          )
        }
      }
      for (const { threadId, threadCounter } of predictedThreadIdCounters) {
        if (
          validationMapReal.get(threadId) !== threadCounter - 1 &&
          validationMapReal.get(threadId) != null
        ) {
          validationErrors.push(
            new Error(
              `Predicted -> Real threadCounter mismatch ${threadId} ${threadCounter} ${validationMapReal.get(
                threadId
              )}`
            )
          )
        }
      }

      if (validationErrors.length > 0) {
        const compositeError: Error = new Error(
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
    const errno = error != null && error.errno != null ? error.errno : 0

    try {
      await query('ROLLBACK;')
    } catch (e) {}

    if (errno === ER_SUBQUERY_NO_1_ROW || errno === ER_NO_SUCH_TABLE) {
      throw new Error(
        `Either event batch has timestamps from the past or incremental importId=${importId} does not exist`
      )
    } else {
      throw error
    }
  } finally {
    await query(`DROP TABLE IF EXISTS ${incrementalImportTableAsId};`)
  }
}

export default commitIncrementalImport
