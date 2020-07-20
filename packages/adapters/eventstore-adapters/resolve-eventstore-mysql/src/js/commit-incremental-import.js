import { ER_NO_SUCH_TABLE, ER_SUBQUERY_NO_1_ROW } from './constants'

const commitIncrementalImport = async (
  { events: { eventsTableName, connection, database }, escapeId, escape },
  importId
) => {
  const incrementalImportTableAsId = escapeId(
    `${eventsTableName}-incremental-import`
  )
  const incrementalImportTableAsString = escape(
    `${eventsTableName}-incremental-import`
  )
  const eventsTableAsId = escapeId(eventsTableName)

  const databaseNameAsString = escape(database)

  try {
    await connection.query(`START TRANSACTION;
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
           
      COMMIT;
      `)
  } catch (error) {
    const errno = error != null && error.errno != null ? error.errno : 0

    try {
      await connection.query('ROLLBACK;')
    } catch (e) {}

    if (errno === ER_SUBQUERY_NO_1_ROW || errno === ER_NO_SUCH_TABLE) {
      throw new Error(
        `Either event batch has timestamps from the past nor incremental importId=${importId} does not exist`
      )
    } else {
      throw error
    }
  } finally {
    await connection.query(
      `DROP TABLE IF EXISTS ${incrementalImportTableAsId};`
    )
  }
}

export default commitIncrementalImport
