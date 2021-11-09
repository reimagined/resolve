import {
  ConcurrentError,
  InputEvent,
  StoredEventPointer,
} from '@resolve-js/eventstore-base'

import {
  ER_DUP_ENTRY,
  ER_LOCK_DEADLOCK,
  ER_SUBQUERY_NO_1_ROW,
} from './constants'
import { AdapterPool } from './types'

const saveEvent = async (
  pool: AdapterPool,
  event: InputEvent
): Promise<StoredEventPointer> => {
  const { eventsTableName, database, escapeId, escape } = pool
  try {
    const eventsTableNameAsId: string = escapeId(eventsTableName)
    const freezeTableNameAsString: string = escape(`${eventsTableName}-freeze`)
    const threadsTableNameAsId: string = escapeId(`${eventsTableName}-threads`)
    const databaseNameAsString: string = escape(database)
    const serializedPayload =
      event.payload != null
        ? escape(JSON.stringify(event.payload))
        : escape('null')

    // prettier-ignore
    await pool.query(
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
        COALESCE(@threadCounter, 0),
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
    return {
      cursor: '',
      event: { ...event, threadId: 0, threadCounter: 0 },
    }
  } catch (error) {
    const errno = error != null && error.errno != null ? error.errno : 0
    const message = error != null && error.message != null ? error.message : ''

    try {
      await pool.query('ROLLBACK;')
    } catch (e) {}

    if (errno === ER_SUBQUERY_NO_1_ROW) {
      throw new Error('Event store is frozen')
    } else if (errno === ER_DUP_ENTRY && message.indexOf('aggregate') > -1) {
      throw new ConcurrentError(event.aggregateId)
    } else if (
      (errno === ER_DUP_ENTRY && message.indexOf('PRIMARY') > -1) ||
      errno === ER_LOCK_DEADLOCK
    ) {
      return await saveEvent(pool, event)
    } else {
      throw error
    }
  }
}

export default saveEvent
