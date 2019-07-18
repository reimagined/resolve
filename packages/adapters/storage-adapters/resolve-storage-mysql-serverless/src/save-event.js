import { ConcurrentError } from 'resolve-storage-base'

const randRange = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min
const fullJitter = retries => randRange(0, Math.min(100, 2 * 2 ** retries))

const saveEvent = async (
  { tableName, executeSql, escapeId, escape },
  event
) => {
  for (let retry = 0; ; retry++) {
    try {
      await executeSql(`
        START TRANSACTION;
        SET @lastEventId = 0;
        SET @lastTimestamp = 0;
        SET @transactionId = 0;

        SELECT @transactionid := CONNECTION_ID(),
        @lastEventId := ${escapeId('eventId')} + 1,
        @lastTimestamp := GREATEST(
          CAST(UNIX_TIMESTAMP(NOW(3)) * 1000 AS SIGNED),
          ${escapeId('timestamp')}
        )
        FROM ${escapeId(`${tableName}-sequence`)}
        WHERE ${escapeId('key')} = 0;
        
        UPDATE ${escapeId(`${tableName}-sequence`)}
        SET ${escapeId('eventId')} = @lastEventId,
        ${escapeId('transactionId')} = @transactionId,
        ${escapeId('timestamp')} = @lastTimestamp
        WHERE ${escapeId('key')} = 0;

        INSERT INTO ${escapeId(tableName)}(
          ${escapeId('eventId')},
          ${escapeId('timestamp')},
          ${escapeId('aggregateId')},
          ${escapeId('aggregateVersion')},
          ${escapeId('type')},
          ${escapeId('payload')}
        ) VALUES (
          @lastEventId,
          @lastTimestamp,
          ${escape(event.aggregateId)},
          ${+event.aggregateVersion},
          ${escape(event.type)},
          ${escape(
            JSON.stringify(event.payload != null ? event.payload : null)
          )}
        );
        
        COMMIT;
        `)
      break
    } catch (error) {
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
