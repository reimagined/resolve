import getLog from './get-log'
import { ResourceAlreadyExistError } from 'resolve-eventstore-base'

const initEventStore = async ({ database, tableName, escapeId, config }) => {
  const log = getLog('initEventStore')

  log.debug(`initializing events database tables`)
  log.verbose(`database: ${database}`)
  log.verbose(`tableName: ${tableName}`)

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
    log.debug(`events database tables are initialized`)
  } catch (error) {
    if (error) {
      let errorToThrow = error
      if (/^SQLITE_ERROR:.*? already exists$/.test(error.message)) {
        errorToThrow = new ResourceAlreadyExistError(
          `duplicate initialization of the sqlite adapter with same file "${config.databaseFile}" not allowed`
        )
      }
      log.error(errorToThrow.message)
      log.verbose(errorToThrow.stack)
      throw errorToThrow
    }
  }
}

export default initEventStore
