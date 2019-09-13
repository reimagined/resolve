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
    [
      `INSERT INTO ${escapeId(databaseName)}.${escapeId(tableName)}(`,
      `${escapeId('eventId')},`,
      `${escapeId('timestamp')},`,
      `${escapeId('aggregateId')},`,
      `${escapeId('aggregateVersion')},`,
      `${escapeId('type')},`,
      `${escapeId('payload')},`,
      `${escapeId('eventSize')}`,
      `) VALUES (`,
      `  ${+event.eventId},`,
      `  ${+event.timestamp},`,
      `  ${serializedEvent},`,
      `  ${byteLength}`,
      `)`
    ].join('')
  )
}

export default saveEventOnly
