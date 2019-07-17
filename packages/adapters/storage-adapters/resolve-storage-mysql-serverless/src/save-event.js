import { ConcurrentError } from 'resolve-storage-base'

const saveEvent = async (
  { tableName, executeSql, escapeId, escapeUnicode },
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
        ${escapeUnicode(event.aggregateId)},
        ${+event.aggregateVersion},
        ${escapeUnicode(event.type)},
        ${escapeUnicode(
          JSON.stringify(event.payload != null ? event.payload : null)
        )}
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
