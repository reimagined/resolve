import { ConcurrentError } from 'resolve-storage-base'

const saveEvent = async ({ tableName, database, escapeId, escape }, event) => {
  try {
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
        `  ${escapeId('timestamp')},`,
        `  ${escapeId('aggregateId')},`,
        `  ${escapeId('aggregateVersion')},`,
        `  ${escapeId('type')},`,
        `  ${escapeId('payload')}`,
        `) VALUES(`,
        ` ${+event.timestamp},`,
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
    if (error.message === 'SQLITE_ERROR: integer overflow') {
      throw new Error('Event store is frozen')
    }
    if (error.code !== 'SQLITE_CONSTRAINT') {
      throw error
    }

    throw new ConcurrentError(event.aggregateId)
  }
}

export default saveEvent
