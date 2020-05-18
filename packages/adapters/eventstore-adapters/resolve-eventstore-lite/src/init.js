import { EventstoreResourceAlreadyExistError } from 'resolve-eventstore-base'

const init = async ({ database, tableName, escapeId, config }) => {
  try {
    await database.exec(
      `CREATE TABLE ${escapeId(tableName)}(
        ${escapeId('threadId')} BIGINT NOT NULL,
        ${escapeId('threadCounter')} BIGINT NOT NULL,
        ${escapeId('timestamp')} BIGINT NOT NULL,
        ${escapeId('aggregateId')} VARCHAR(700) NOT NULL,
        ${escapeId('aggregateVersion')} BIGINT NOT NULL,
        ${escapeId('type')} VARCHAR(700) NOT NULL,
        ${escapeId('payload')} JSON NULL,
        PRIMARY KEY(${escapeId('threadId')}, ${escapeId('threadCounter')}),
        UNIQUE(${escapeId('aggregateId')}, ${escapeId('aggregateVersion')})
      );
      CREATE INDEX ${escapeId('aggregateIdAndVersion-idx')} ON ${escapeId(
        tableName
      )}(
        ${escapeId('aggregateId')}, ${escapeId('aggregateVersion')}
      );
      CREATE INDEX ${escapeId('aggregateId-idx')} ON ${escapeId(tableName)}(
        ${escapeId('aggregateId')}
      );
      CREATE INDEX ${escapeId('aggregateVersion-idx')} ON ${escapeId(
        tableName
      )}(
        ${escapeId('aggregateVersion')}
      );
      CREATE INDEX ${escapeId('type-idx')} ON ${escapeId(tableName)}(
        ${escapeId('type')}
      );
      CREATE INDEX ${escapeId('timestamp-idx')} ON ${escapeId(tableName)}(
        ${escapeId('timestamp')}
      )
      `
    )
  } catch (error) {
    if (
      error != null &&
      /^SQLITE_ERROR:.*? already exists$/.test(error.message)
    ) {
      throw new EventstoreResourceAlreadyExistError(
        `Double-initialize eventstore-lite adapter via "${config.databaseFile}" failed`
      )
    } else {
      throw error
    }
  }
}

export default init
