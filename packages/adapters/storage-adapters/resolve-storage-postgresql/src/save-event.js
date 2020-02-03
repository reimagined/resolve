import { ConcurrentError } from 'resolve-storage-base'

import { RESERVED_EVENT_SIZE, LONG_NUMBER_SQL_TYPE } from './constants'

const saveEvent = async (
  { databaseName, tableName, executeStatement, escapeId, escape },
  event
) => {
  while (true) {
    try {
      const serializedEvent = [
        `${escape(event.aggregateId)},`,
        `${+event.aggregateVersion},`,
        `${escape(event.type)},`,
        escape(JSON.stringify(event.payload != null ? event.payload : null))
      ].join('')

      // TODO: Improve calculation byteLength depend on codepage and wide-characters
      const byteLength =
        Buffer.byteLength(serializedEvent) + RESERVED_EVENT_SIZE

      await executeStatement(
        `WITH ${escapeId('freeze_check')} AS (
          SELECT 0 AS ${escapeId('freeze_zero')} WHERE (
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
          ) = ${escape('Event store is frozen')}
        ), ${escapeId('vacant_thread_id')} AS (
          SELECT ${escapeId('threadId')}
          FROM ${escapeId(databaseName)}.${escapeId(`${tableName}-threads`)}
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        ),${escapeId('random_thread_id')} AS (
          SELECT ${escapeId('threadId')}
          FROM ${escapeId(databaseName)}.${escapeId(`${tableName}-threads`)}
          OFFSET FLOOR(Random() * 256)
          LIMIT 1
        ), ${escapeId('vector_id')} AS (
          SELECT ${escapeId('threadId')}, ${escapeId('threadCounter')}
          FROM ${escapeId(databaseName)}.${escapeId(`${tableName}-threads`)}
          WHERE ${escapeId('threadId')} = COALESCE(
            (SELECT ${escapeId('threadId')} FROM ${escapeId(
          'vacant_thread_id'
        )}),
            (SELECT ${escapeId('threadId')} FROM ${escapeId(
          'random_thread_id'
        )})
          ) FOR UPDATE
          LIMIT 1
        ), ${escapeId('update_vector_id')} AS (
          UPDATE ${escapeId(databaseName)}.${escapeId(`${tableName}-threads`)}
          SET ${escapeId('threadCounter')} = ${escapeId('threadCounter')} + 1
          WHERE ${escapeId('threadId')} = (
            SELECT ${escapeId('threadId')} FROM ${escapeId('vector_id')} LIMIT 1
          )
          RETURNING *
        ) INSERT INTO ${escapeId(databaseName)}.${escapeId(tableName)}(
          ${escapeId('threadId')},
          ${escapeId('threadCounter')},
          ${escapeId('timestamp')},
          ${escapeId('aggregateId')},
          ${escapeId('aggregateVersion')},
          ${escapeId('type')},
          ${escapeId('payload')},
          ${escapeId('eventSize')}
        ) VALUES (
          (SELECT ${escapeId('threadId')} FROM ${escapeId(
          'vector_id'
        )} LIMIT 1) +
          (SELECT ${escapeId('freeze_zero')} FROM ${escapeId(
          'freeze_check'
        )} LIMIT 1),
          (SELECT ${escapeId('threadCounter')} FROM ${escapeId(
          'vector_id'
        )} LIMIT 1),
          GREATEST(
            CAST(extract(epoch from clock_timestamp()) * 1000 AS ${LONG_NUMBER_SQL_TYPE}),
            ${+event.timestamp}
          ),
          ${serializedEvent},
          ${byteLength}
        )`
      )

      break
    } catch (error) {
      const errorMessage =
        error != null && error.message != null ? error.message : ''

      if (errorMessage.indexOf('subquery used as an expression') > -1) {
        throw new Error('Event store is frozen')
      } else if (/"aggregateIdAndVersion"/i.test(errorMessage)) {
        throw new ConcurrentError(event.aggregateId)
      } else {
        throw error
      }
    }
  }
}

export default saveEvent
