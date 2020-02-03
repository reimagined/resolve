import { RESERVED_EVENT_SIZE } from './constants'

const saveEventOnly = async function(pool, event) {
  const { databaseName, tableName, executeStatement, escapeId, escape } = pool

  const serializedEvent = [
    `${escape(event.aggregateId)},`,
    `${+event.aggregateVersion},`,
    `${escape(event.type)},`,
    escape(JSON.stringify(event.payload != null ? event.payload : null))
  ].join('')

  const byteLength = Buffer.byteLength(serializedEvent) + RESERVED_EVENT_SIZE

  await executeStatement(
    `WITH ${escapeId('vector_id')} AS (
      SELECT ${escapeId('threadId')}, ${escapeId('threadCounter')}
      FROM ${escapeId(databaseName)}.${escapeId(`${tableName}-threads`)}
      WHERE ${escapeId('threadId')} = FLOOR(Random() * 256)
      FOR UPDATE LIMIT 1
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
      (SELECT ${escapeId('threadId')} FROM ${escapeId('vector_id')} LIMIT 1),
      (SELECT ${escapeId('threadCounter')} FROM ${escapeId(
      'vector_id'
    )} LIMIT 1),
      ${+event.timestamp},
      ${serializedEvent},
      ${byteLength}
    )`
  )
}

export default saveEventOnly
