import { ConcurrentError } from 'resolve-storage-base'

import { RESERVED_EVENT_SIZE, LONG_NUMBER_SQL_TYPE } from './constants'

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
        `WITH ${escapeId('freeze_check')} AS (
        SELECT 0 AS ${escapeId('lastEventId')},
        0 AS ${escapeId('lastTimestamp')} WHERE (
          (SELECT ${escape('Event store is frozen')} AS ${escapeId(
          'EventStoreIsFrozen'
        )})
        UNION ALL
          (SELECT ${escape('Event store is frozen')} AS ${escapeId(
          'EventStoreIsFrozen'
        )}
          FROM ${escapeId('information_schema')}.${escapeId('tables')}
          WHERE ${escapeId('table_schema')} = ${escape(databaseName)}
          AND ${escapeId('table_name')} = ${escape(`${tableName}-freeze`)})
        ) = ${escape('OK')}
      ), ${escapeId('last_event')} AS (
          (SELECT ${escapeId('eventId')} AS ${escapeId('lastEventId')},
          ${escapeId('timestamp')} AS ${escapeId('lastTimestamp')}
          FROM ${escapeId(databaseName)}.${escapeId(tableName)}
          ORDER BY ${escapeId('eventId')} DESC
          LIMIT 1)
        UNION ALL
          (SELECT ${escapeId('lastEventId')}, ${escapeId('lastTimestamp')}
          FROM ${escapeId('freeze_check')})
      ) INSERT INTO ${escapeId(databaseName)}.${escapeId(tableName)}(
        ${escapeId('eventId')},
        ${escapeId('timestamp')},
        ${escapeId('aggregateId')},
        ${escapeId('aggregateVersion')},
        ${escapeId('type')},
        ${escapeId('payload')},
        ${escapeId('eventSize')}
      ) VALUES (
        (SELECT MAX(${escapeId('lastEventId')}) + 1
        FROM ${escapeId('last_event')}),
        (SELECT GREATEST(
          CAST(extract(epoch from now()) * 1000 AS ${LONG_NUMBER_SQL_TYPE}),
          MAX(${escapeId('lastTimestamp')})
        ) FROM ${escapeId('last_event')}), 
        ${serializedEvent},
        ${byteLength}
      )`
      )

      break
    } catch (error) {
      const errorMessage =
        error != null && error.message == null ? error.message : ''

      if (errorMessage.indexOf('subquery used as an expression') > -1) {
        throw new Error('Event store is frozen')
      } else if (errorMessage.indexOf('duplicate key') < 0) {
        throw error
      } else if (errorMessage.indexOf('aggregateIdAndVersion') > -1) {
        throw new ConcurrentError(event.aggregateId)
      }

      await new Promise(resolve => setTimeout(resolve, fullJitter(retry)))
    }
  }
}

export default saveEvent
