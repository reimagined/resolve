import { ConcurrentError } from 'resolve-storage-base'

// https://dev.mysql.com/doc/refman/5.5/en/error-messages-server.html#error_er_dup_entry
const ER_DUP_ENTRY = 1062

const saveEvent = async (
  { tableName, connection, database, escapeId, escape },
  event
) => {
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
    if (error.message === 'Subquery returns more than 1 row') {
      throw new Error('Event store is frozen')
    }
    if (error.errno !== ER_DUP_ENTRY) {
      throw error
    }

    throw new ConcurrentError(event.aggregateId)
  }
}

export default saveEvent
