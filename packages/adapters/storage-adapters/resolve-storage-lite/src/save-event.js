import { ConcurrentError } from 'resolve-storage-base'

const saveEvent = async ({ tableName, database, escapeId, escape }, event) => {
  try {
    await database.exec(
      `INSERT INTO ${escapeId(tableName)}(
        ${escapeId('timestamp')},
        ${escapeId('aggregateId')},
        ${escapeId('aggregateVersion')},
        ${escapeId('type')},
        ${escapeId('payload')}
      ) VALUES(
        ${+event.timestamp},
        ${escape(event.aggregateId)},
        ${+event.aggregateVersion},
        ${escape(event.type)},
        json(CAST(${
          event.payload != null
            ? escape(JSON.stringify(event.payload))
            : escape('null')
        } AS BLOB))
      )`
    )
  } catch (error) {
    if (error.code !== 'SQLITE_CONSTRAINT') {
      throw error
    }

    throw new ConcurrentError(event.aggregateId)
  }
}

export default saveEvent
