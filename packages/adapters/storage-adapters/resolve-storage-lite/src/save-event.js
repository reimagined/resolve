import { ConcurrentError } from 'resolve-storage-base'

const saveEvent = async (pool, event) => {
  const { tableName, database, escapeId, escape } = pool
  try {
    const currentThreadId = Math.floor(Math.random() * 256)
    await database.exec(
      [
        `BEGIN IMMEDIATE;`,
        `SELECT ABS(${escapeId('CTE')}.${escapeId(
          'EventStoreIsFrozen'
        )}) FROM (`,
        `  SELECT 0 AS ${escapeId('EventStoreIsFrozen')}`,
        `UNION ALL`,
        `  SELECT -9223372036854775808 AS ${escapeId('EventStoreIsFrozen')}`,
        `  FROM ${escapeId('sqlite_master')}`,
        `  WHERE ${escapeId('type')} = ${escape('table')} AND `,
        `  ${escapeId('name')} = ${escape(`${tableName}-freeze`)}`,
        `) ${escapeId('CTE')};`,
        `INSERT INTO ${escapeId(tableName)}(`,
        `  ${escapeId('threadId')},`,
        `  ${escapeId('threadCounter')},`,
        `  ${escapeId('timestamp')},`,
        `  ${escapeId('aggregateId')},`,
        `  ${escapeId('aggregateVersion')},`,
        `  ${escapeId('type')},`,
        `  ${escapeId('payload')}`,
        `) VALUES(`,
        ` ${+currentThreadId},`,
        ` COALESCE(`,
        `   (SELECT MAX(${escapeId('threadCounter')}) FROM ${escapeId(
          tableName
        )}`,
        `   WHERE ${escapeId('threadId')} = ${+currentThreadId}) + 1,`,
        `   0`,
        ` ),`,
        ` MAX(`,
        `   CAST(strftime('%s','now') || substr(strftime('%f','now'),4) AS INTEGER),`,
        `   ${+event.timestamp}`,
        ` ),`,
        ` ${escape(event.aggregateId)},`,
        ` ${+event.aggregateVersion},`,
        ` ${escape(event.type)},`,
        `  json(CAST(${
          event.payload != null
            ? escape(JSON.stringify(event.payload))
            : escape('null')
        } AS BLOB))`,
        `);`,
        `COMMIT;`
      ].join('\n')
    )
  } catch (error) {
    const errorMessage =
      error != null && error.message != null ? error.message : ''
    const errorCode = error != null && error.code != null ? error.code : ''

    if (errorMessage === 'SQLITE_ERROR: integer overflow') {
      throw new Error('Event store is frozen')
    } else if (
      errorCode === 'SQLITE_CONSTRAINT' &&
      errorMessage.indexOf('aggregate') > -1
    ) {
      throw new ConcurrentError(event.aggregateId)
    } else if (
      errorCode === 'SQLITE_CONSTRAINT' &&
      errorMessage.indexOf('PRIMARY') > -1
    ) {
      try {
        await database.exec('ROLLBACK;')
      } catch (e) {}

      return await saveEvent(pool, event)
    } else {
      throw error
    }
  }
}

export default saveEvent
