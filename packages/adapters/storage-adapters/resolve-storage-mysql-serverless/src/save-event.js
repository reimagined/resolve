import { ConcurrentError } from 'resolve-storage-base'

const randRange = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min
const fullJitter = retries => randRange(0, Math.min(100, 2 * 2 ** retries))

const saveEvent = async (
  {
    tableName,
    executeStatement,
    beginTransaction,
    commitTransaction,
    rollbackTransaction,
    escapeId,
    escapeUnicode
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
        `
        SELECT ${escapeId('eventId')} + 1  AS ${escapeId('lastEventId')},
        GREATEST(
          CAST(UNIX_TIMESTAMP(NOW(3)) * 1000 AS SIGNED),
          ${escapeId('timestamp')}
        ) AS ${escapeId('lastTimestamp')}
        FROM ${escapeId(`${tableName}-sequence`)}
        WHERE ${escapeId('key')} = 0;
      `,
        transactionId
      )

      await executeStatement(
        `
        UPDATE ${escapeId(`${tableName}-sequence`)}
        SET ${escapeId('eventId')} = ${+lastEventId},
        ${escapeId('transactionId')} = ${escapeUnicode(transactionId)},
        ${escapeId('timestamp')} = ${+lastTimestamp}
        WHERE ${escapeId('key')} = 0;
      `,
        transactionId
      )

      await executeStatement(
        `
        INSERT INTO ${escapeId(tableName)}(
          ${escapeId('eventId')},
          ${escapeId('timestamp')},
          ${escapeId('aggregateId')},
          ${escapeId('aggregateVersion')},
          ${escapeId('type')},
          ${escapeId('payload')}
        ) VALUES (
          ${+lastEventId},
          ${+lastTimestamp},
          ${escapeUnicode(event.aggregateId)},
          ${+event.aggregateVersion},
          ${escapeUnicode(event.type)},
          ${escapeUnicode(
            JSON.stringify(event.payload != null ? event.payload : null)
          )}
        );
      `,
        transactionId
      )

      await commitTransaction(transactionId)

      break
    } catch (error) {
      await rollbackTransaction(transactionId)

      if (
        error.message == null ||
        !error.message.startsWith('Duplicate entry')
      ) {
        throw error
      }

      if (error.message.endsWith("for key 'PRIMARY'")) {
        await new Promise(resolve => setTimeout(resolve, fullJitter(retry)))
        continue
      }

      throw new ConcurrentError(
        `Can not save the event because aggregate '${event.aggregateId}' is not actual at the moment. Please retry later.`
      )
    }
  }
}

export default saveEvent
