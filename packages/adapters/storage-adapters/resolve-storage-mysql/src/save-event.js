import { ConcurrentError } from 'resolve-storage-base'

const ER_SUBQUERY_NO_1_ROW = 1242
const ER_LOCK_DEADLOCK = 1213
const ER_DUP_ENTRY = 1062

const saveEvent = async (pool, event) => {
  const { tableName, connection, database, escapeId, escape } = pool
  try {
    await connection.query(
      [
        `START TRANSACTION;`,
        `SELECT ${escape('OK')}`,
        `FROM ${escapeId('information_schema')}.${escapeId('tables')}`,
        `WHERE (`,
        `    SELECT ${escape('Event store is frozen')} AS ${escapeId(
          'EventStoreIsFrozen'
        )}`,
        `  UNION ALL`,
        `    SELECT ${escape('Event store is frozen')} AS ${escapeId(
          'EventStoreIsFrozen'
        )}`,
        `    FROM ${escapeId('information_schema')}.${escapeId(
          'tables'
        )} ${escapeId('IS')}`,
        `    WHERE ${escapeId('IS')}.${escapeId('table_schema')} = ${escape(
          database
        )}`,
        `    AND ${escapeId('IS')}.${escapeId('table_name')} = ${escape(
          `${tableName}-freeze`
        )}`,
        `) = ${escape('OK')};`,
        `SET @selectedThreadId = FLOOR(RAND() * 256);`,
        `SELECT @nextThreadCounter := MAX(${escapeId('threadCounter')}) + 1`,
        `FROM ${escapeId(tableName)}`,
        `WHERE ${escapeId('threadId')} = @selectedThreadId`,
        `FOR UPDATE;`,
        `INSERT INTO ${escapeId(tableName)}(`,
        `  ${escapeId('threadId')},`,
        `  ${escapeId('threadCounter')},`,
        `  ${escapeId('timestamp')},`,
        `  ${escapeId('aggregateId')},`,
        `  ${escapeId('aggregateVersion')},`,
        `  ${escapeId('type')},`,
        `  ${escapeId('payload')}`,
        `) VALUES(`,
        ` @selectedThreadId,`,
        ` COALESCE(@nextThreadCounter, 0),`,
        ` GREATEST(`,
        `   ROUND(UNIX_TIMESTAMP(SYSDATE(4)) * 1000),`,
        `   ${+event.timestamp}`,
        ` ),`,
        ` ${escape(event.aggregateId)},`,
        ` ${+event.aggregateVersion},`,
        ` ${escape(event.type)},`,
        `  (CAST(${
          event.payload != null
            ? escape(JSON.stringify(event.payload))
            : escape('null')
        } AS JSON))`,
        `);`,
        `COMMIT;`
      ].join('\n')
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
