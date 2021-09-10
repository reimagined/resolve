import { ER_NO_SUCH_TABLE, ER_SUBQUERY_NO_1_ROW } from './constants'
import type { AdapterPool } from './types'
import type { VersionlessEvent } from '@resolve-js/eventstore-base'

const pushIncrementalImport = async (
  { eventsTableName, connection, database, escapeId, escape }: AdapterPool,
  events: VersionlessEvent[],
  importId: string
): Promise<void> => {
  try {
    const incrementalImportTableAsId = escapeId(
      `${eventsTableName}-incremental-import`
    )
    const incrementalImportTableAsString = escape(
      `${eventsTableName}-incremental-import`
    )
    const databaseNameAsString = escape(database)

    await connection.query(
      `START TRANSACTION;
      
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
         
      INSERT INTO ${incrementalImportTableAsId}(
        \`rowid\`, \`timestamp\`, \`aggregateId\`, \`type\`, \`payload\`
      ) VALUES ${events
        .map(
          (event: VersionlessEvent) => `(${escape(
            `${Date.now()}${Math.random()}`
          )}, ${+event.timestamp}, ${escape(event.aggregateId)}, ${escape(
            event.type
          )}, 
      ${
        event.payload != null
          ? escape(JSON.stringify(event.payload))
          : escape('null')
      })`
        )
        .join(',')};
    
    COMMIT;
      `
    )
  } catch (error) {
    const errno = error != null && error.errno != null ? error.errno : 0
    try {
      await connection.query(`ROLLBACK;`)
    } catch (e) {}
    if (errno === ER_NO_SUCH_TABLE || errno === ER_SUBQUERY_NO_1_ROW) {
      throw new Error(`Incremental importId=${importId} does not exist`)
    } else {
      throw error
    }
  }
}

export default pushIncrementalImport
