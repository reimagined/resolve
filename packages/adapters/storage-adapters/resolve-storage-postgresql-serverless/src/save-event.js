import { ConcurrentError } from 'resolve-storage-base'
import { aggregateName } from 'resolve-module-comments/src/common/defaults'

const randRange = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min
const fullJitter = retries => randRange(0, Math.min(100, 2 * 2 ** retries))

const RESERVED_EVENT_SIZE = 2 << (5 + 2) // For reserved BIGINT fields

const saveEvent = async (
  {
    databaseName,
    tableName,
    executeStatement,
    beginTransaction,
    commitTransaction,
    rollbackTransaction,
    escapeId,
    escape
  },
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
          `CAST(extract(epoch from now()) * 1000 AS BIGINT),${escapeId(
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
          )} = CAST(txid_current() AS VARCHAR(190)),`,
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
          )} = CAST(txid_current() AS VARCHAR(190))`,
          `),(`,
          `SELECT ${escapeId('timestamp')} `,
          `FROM ${escapeId(databaseName)}.${escapeId(
            `${tableName}-sequence`
          )} `,
          `WHERE ${escapeId('key')} = 0 `,
          `AND ${escapeId(
            'transactionId'
          )} = CAST(txid_current() AS VARCHAR(190))`,
          `),${serializedEvent},${byteLength});`,
          `COMMIT;`
        ].join('')
      )

      break
    } catch (error) {
      try {
        await executeStatement(`ROLLBACK;`)
      } catch (e) {}

      if (error.message == null || error.message.indexOf('duplicate key') < 0) {
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
