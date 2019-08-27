import { ConcurrentError } from 'resolve-storage-base'

const randRange = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min
const fullJitter = retries => randRange(0, Math.min(100, 2 * 2 ** retries))

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
    let transactionId = null
    try {
      transactionId = await beginTransaction()

      const [
        { lastEventId, lastTimestamp } = { lastEventId: 0, lastTimestamp: 0 }
      ] = await executeStatement(
        [
          `SELECT ${escapeId('eventId')} + 1  AS ${escapeId('lastEventId')},`,
          `GREATEST(`,
          `CAST(extract(epoch from now()) * 1000 AS BIGINT),`,
          `${escapeId('timestamp')}`,
          `) AS ${escapeId('lastTimestamp')}`,
          `FROM ${escapeId(databaseName)}.${escapeId(`${tableName}-sequence`)}`,
          `WHERE ${escapeId('key')} = 0;`
        ].join(''),
        transactionId
      )

      const serializedEvent = [
        `${+lastEventId},`,
        `${+lastTimestamp},`,
        `${escape(event.aggregateId)},`,
        `${+event.aggregateVersion},`,
        `${escape(event.type)},`,
        escape(JSON.stringify(event.payload != null ? event.payload : null))
      ].join('')

      const byteLength = Buffer.byteLength(serializedEvent)

      await executeStatement(
        [
          `UPDATE ${escapeId(databaseName)}.${escapeId(
            `${tableName}-sequence`
          )} `,
          `SET ${escapeId('eventId')} = ${+lastEventId},`,
          `${escapeId('transactionId')} = ${escape(transactionId)},`,
          `${escapeId('timestamp')} = ${+lastTimestamp} `,
          `WHERE ${escapeId('key')} = 0;`,
          `INSERT INTO ${escapeId(databaseName)}.${escapeId(tableName)}(`,
          `${escapeId('eventId')},`,
          `${escapeId('timestamp')},`,
          `${escapeId('aggregateId')},`,
          `${escapeId('aggregateVersion')},`,
          `${escapeId('type')},`,
          `${escapeId('payload')},`,
          `${escapeId('eventSize')}`,
          `) VALUES (`,
          `${serializedEvent},`,
          `${serializedPayload},`,
          `${byteLength}`,
          `);`
        ].join(''),
        transactionId
      )

      await commitTransaction(transactionId)

      break
    } catch (error) {
      await rollbackTransaction(transactionId)

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
