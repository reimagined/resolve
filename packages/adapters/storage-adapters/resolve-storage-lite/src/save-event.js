import { ConcurrentError } from 'resolve-storage-base'

// https://www.sqlite.org/rescode.html#constraint_unique
const SQLITE_CONSTRAINT_UNIQUE = 2067

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
