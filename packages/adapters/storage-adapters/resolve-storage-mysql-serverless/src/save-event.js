import { ConcurrentError } from 'resolve-storage-base'

const saveEvent = async (
  { tableName, executeSql, escapeId, escape },
  event
) => {
  try {
    await executeSql(
      `INSERT INTO ${escapeId(tableName)}(
        ${escapeId('timestamp')},
        ${escapeId('aggregateId')},
        ${escapeId('aggregateVersion')},
        ${escapeId('type')},
        ${escapeId('payload')}
      ) VALUES (
        CAST(UNIX_TIMESTAMP(NOW(3)) * 1000 AS SIGNED),
        ${escape(event.aggregateId)},
        ${+event.aggregateVersion},
        ${escape(event.type)},
        ${escape(JSON.stringify(event.payload != null ? event.payload : null))}
      )`
    )
  } catch (error) {
    if (error.message == null || !error.message.startsWith('Duplicate entry')) {
      throw error
    }

    throw new ConcurrentError(
      `Can not save the event because aggregate '${event.aggregateId}' is not actual at the moment. Please retry later.`
    )
  }
}

export default saveEvent
