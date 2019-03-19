import { ConcurrentError } from 'resolve-storage-base'

// https://www.sqlite.org/rescode.html#constraint_unique
const SQLITE_CONSTRAINT_UNIQUE = 2067

const saveEvent = async ({ tableName, database, escapeId }, event) => {
  try {
    await connection.exec(
      `INSERT INTO ${escapeId(tableName)}(
        ${escapeId('timestamp')},
        ${escapeId('aggregateId')},
        ${escapeId('aggregateVersion')},
        ${escapeId('type')},
        ${escapeId('payload')}
      ) VALUES (
        ${+event.timestamp},
        ${escape(event.aggregateId)},
        ${+event.aggregateVersion},
        ${escape(event.type)},
        ${escape(JSON.stringify(event.payload != null ? event.payload : null))}
      )`
    )
  } catch (error) {
    if (error.errno !== SQLITE_CONSTRAINT_UNIQUE) {
      throw error
    }

    throw new ConcurrentError(
      `Can not save the event because aggregate '${
        event.aggregateId
      }' is not actual at the moment. Please retry later.`
    )
  }
}

export default saveEvent
