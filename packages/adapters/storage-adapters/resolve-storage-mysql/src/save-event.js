import { ConcurrentError } from 'resolve-storage-base'

const ER_SUBQUERY_NO_1_ROW = 1242
const ER_LOCK_DEADLOCK = 1213
const ER_DUP_ENTRY = 1062

const saveEvent = async (pool, event) => {
  const { tableName, connection, database, escapeId, escape } = pool
  try {
    const eventsTableNameAsId = escapeId(tableName)
    const freezeTableNameAsString = escape(`${tableName}-freeze`)
    const threadsTableNameAsId = escapeId(`${tableName}-threads`)
    const databaseNameAsString = escape(database)
    const serializedPayload =
      event.payload != null
        ? escape(JSON.stringify(event.payload))
        : escape('null')

    // prettier-ignore
    await connection.query(
      `START TRANSACTION;
      SELECT 1 FROM \`information_schema\`.\`tables\`
      WHERE (
         SELECT 0 AS \`EventStoreIsFrozen\`
       UNION ALL
          SELECT 0 AS \`EventStoreIsFrozen\`
          FROM \`information_schema\`.\`tables\` \`INF\`
          WHERE \`INF\`.\`table_schema\` = ${databaseNameAsString}
          AND \`INF\`.\`table_name\` = ${freezeTableNameAsString}
       ) = 0;
       
      SET @selectedThreadId = FLOOR(RAND() * 256);
      
      SELECT @threadCounter := \`threadCounter\`
      FROM ${threadsTableNameAsId}
      WHERE \`threadId\` = @selectedThreadId
      FOR UPDATE;
      
      UPDATE ${threadsTableNameAsId}
      SET \`threadCounter\` = \`threadCounter\` + 1
      WHERE \`threadId\` = @selectedThreadId;
      
      INSERT INTO ${eventsTableNameAsId}(
        \`threadId\`,
        \`threadCounter\`,
        \`timestamp\`,
        \`aggregateId\`,
        \`aggregateVersion\`,
        \`type\`,
        \`payload\`
      ) VALUES(
        @selectedThreadId,
        COALESCE(@threadCounter + 1, 0),
        GREATEST(
          ROUND(UNIX_TIMESTAMP(SYSDATE(4)) * 1000),
          ${+event.timestamp}
        ),
        ${escape(event.aggregateId)},
        ${+event.aggregateVersion},
        ${escape(event.type)},
        (CAST(${serializedPayload} AS JSON))
      );
      
      COMMIT;`
    )
  } catch (error) {
    const errno = error != null && error.errno != null ? error.errno : 0
    const message = error != null && error.message != null ? error.message : ''

    if (errno === ER_SUBQUERY_NO_1_ROW) {
      throw new Error('Event store is frozen')
    } else if (errno === ER_DUP_ENTRY && message.indexOf('aggregate') > -1) {
      throw new ConcurrentError(event.aggregateId)
    } else if (
      (errno === ER_DUP_ENTRY && message.indexOf('PRIMARY') > -1) ||
      errno === ER_LOCK_DEADLOCK
    ) {
      try {
        await connection.query('ROLLBACK;')
      } catch (e) {}

      return await saveEvent(pool, event)
    } else {
      throw error
    }
  }
}

export default saveEvent
