import { ConcurrentError } from 'resolve-storage-base'

import {
  RESERVED_EVENT_SIZE,
  LONG_NUMBER_SQL_TYPE,
  LONG_STRING_SQL_TYPE
} from './constants'

const saveEvent = async (
  { databaseName, tableName, executeStatement, fullJitter, escapeId, escape },
  event
) => {
  for (let retry = 0; ; retry++) {
    try {
      const serializedEvent = [
        `${escape(event.aggregateId)},`,
        `${+event.aggregateVersion},`,
        `${escape(event.type)},`,
        escape(JSON.stringify(event.payload != null ? event.payload : null))
      ].join('')

      const byteLength =
        Buffer.byteLength(serializedEvent) + RESERVED_EVENT_SIZE

      await executeStatement(
        [
          `START TRANSACTION;`,
          `SELECT ${escape('OK')} WHERE (`,
          `  (SELECT ${escape('Event store is frozen')} AS ${escapeId(
            'EventStoreIsFrozen'
          )})`,
          `UNION ALL (`,
          `  SELECT ${escape('Event store is frozen')} AS ${escapeId(
            'EventStoreIsFrozen'
          )}`,
          `  FROM ${escapeId('information_schema')}.${escapeId('tables')}`,
          `  WHERE ${escapeId('table_schema')} = ${escape(databaseName)}`,
          `  AND ${escapeId('table_name')} = ${escape(`${tableName}-freeze`)}`,
          `)) = ${escape('OK')};`,
          `WITH cte (`,
          `${escapeId('lastEventId')},${escapeId('lastTimestamp')}`,
          `) AS (VALUES ((`,
          `SELECT ${escapeId('eventId')} + 1 AS ${escapeId('lastEventId')} `,
          `FROM ${escapeId(databaseName)}.${escapeId(
            `${tableName}-sequence`
          )} `,
          `WHERE ${escapeId('key')} = 0`,
          `),(`,
          `SELECT GREATEST(`,
          `CAST(extract(epoch from now()) * 1000 AS ${LONG_NUMBER_SQL_TYPE}),${escapeId(
            'timestamp'
          )})`,
          `AS ${escapeId('lastTimestamp')}`,
          `FROM ${escapeId(databaseName)}.${escapeId(
            `${tableName}-sequence`
          )} `,
          `WHERE ${escapeId('key')} = 0`,
          `)))`,
          `UPDATE ${escapeId(databaseName)}.${escapeId(
            `${tableName}-sequence`
          )} `,
          `SET ${escapeId('eventId')} = cte.${escapeId('lastEventId')},`,
          `${escapeId(
            'transactionId'
          )} = CAST(txid_current() AS ${LONG_STRING_SQL_TYPE}),`,
          `${escapeId('timestamp')} = cte.${escapeId('lastTimestamp')} `,
          `FROM cte `,
          `WHERE ${escapeId('key')} = 0;`,
          `INSERT INTO ${escapeId(databaseName)}.${escapeId(tableName)}(`,
          `${escapeId('eventId')},`,
          `${escapeId('timestamp')},`,
          `${escapeId('aggregateId')},`,
          `${escapeId('aggregateVersion')},`,
          `${escapeId('type')},`,
          `${escapeId('payload')},`,
          `${escapeId('eventSize')}`,
          `) VALUES ((`,
          `SELECT ${escapeId('eventId')} `,
          `FROM ${escapeId(databaseName)}.${escapeId(
            `${tableName}-sequence`
          )} `,
          `WHERE ${escapeId('key')} = 0 `,
          `AND ${escapeId(
            'transactionId'
          )} = CAST(txid_current() AS ${LONG_STRING_SQL_TYPE})`,
          `),(`,
          `SELECT ${escapeId('timestamp')} `,
          `FROM ${escapeId(databaseName)}.${escapeId(
            `${tableName}-sequence`
          )} `,
          `WHERE ${escapeId('key')} = 0 `,
          `AND ${escapeId(
            'transactionId'
          )} = CAST(txid_current() AS ${LONG_STRING_SQL_TYPE})`,
          `),${serializedEvent},${byteLength});`,
          `COMMIT;`
        ].join('')
      )

      break
    } catch (error) {
      try {
        await executeStatement(`ROLLBACK;`)
      } catch (e) {}
      if (error.message == null) {
        throw error
      }
      if (error.message.indexOf('subquery used as an expression') > -1) {
        throw new Error('Event store is frozen')
      }
      if (error.message.indexOf('duplicate key') < 0) {
        throw error
      }

      if (error.message.indexOf('aggregateIdAndVersion') < 0) {
        await new Promise(resolve => setTimeout(resolve, fullJitter(retry)))
        continue
      }

      throw new ConcurrentError(event.aggregateId)
    }
  }
}

export default saveEvent
