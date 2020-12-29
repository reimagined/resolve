import { EventstoreResourceAlreadyExistError } from 'resolve-eventstore-base'
import { AGGREGATE_ID_SQL_TYPE } from './constants'
import getLog from './get-log'
import { AdapterPool } from './types'

const init = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('init')
  log.debug('initializing databases')
  const {
    database,
    eventsTableName,
    snapshotsTableName,
    secretsTableName,
    escapeId,
    config,
  } = pool

  try {
    await database.exec(
      `CREATE TABLE ${escapeId(eventsTableName)}(
        ${escapeId('threadId')} BIGINT NOT NULL,
        ${escapeId('threadCounter')} BIGINT NOT NULL,
        ${escapeId('timestamp')} BIGINT NOT NULL,
        ${escapeId('aggregateId')} ${AGGREGATE_ID_SQL_TYPE} NOT NULL,
        ${escapeId('aggregateVersion')} BIGINT NOT NULL,
        ${escapeId('type')} VARCHAR(700) NOT NULL,
        ${escapeId('payload')} JSON NULL,
        PRIMARY KEY(${escapeId('threadId')}, ${escapeId('threadCounter')}),
        UNIQUE(${escapeId('aggregateId')}, ${escapeId('aggregateVersion')})
      );
      CREATE INDEX ${escapeId('aggregateIdAndVersion-idx')} ON ${escapeId(
        eventsTableName
      )}(
        ${escapeId('aggregateId')}, ${escapeId('aggregateVersion')}
      );
      CREATE INDEX ${escapeId('aggregateId-idx')} ON ${escapeId(
        eventsTableName
      )}(
        ${escapeId('aggregateId')}
      );
      CREATE INDEX ${escapeId('aggregateVersion-idx')} ON ${escapeId(
        eventsTableName
      )}(
        ${escapeId('aggregateVersion')}
      );
      CREATE INDEX ${escapeId('type-idx')} ON ${escapeId(eventsTableName)}(
        ${escapeId('type')}
      );
      CREATE INDEX ${escapeId('timestamp-idx')} ON ${escapeId(eventsTableName)}(
        ${escapeId('timestamp')}
      )
      `
    )
    log.debug(`events database tables are initialized`)

    await database.exec(
      `CREATE TABLE ${escapeId(snapshotsTableName)} (
        ${escapeId('snapshotKey')} TEXT,
        ${escapeId('content')} TEXT,
        PRIMARY KEY(${escapeId('snapshotKey')})
        )`
    )
    log.debug(`snapshots database tables are initialized`)

    await database.exec(`CREATE TABLE ${escapeId(secretsTableName)} (
        ${escapeId('idx')} BIG INT NOT NULL,
        ${escapeId('id')} ${AGGREGATE_ID_SQL_TYPE} NOT NULL,
        ${escapeId('secret')} text,
        PRIMARY KEY(${escapeId('id')}, ${escapeId('idx')})
      )`)
    log.debug(`secrets store database tables are initialized`)
  } catch (error) {
    if (error != null) {
      let errorToThrow = error
      if (/^SQLITE_ERROR:.*? already exists$/.test(error.message)) {
        errorToThrow = new EventstoreResourceAlreadyExistError(
          `duplicate initialization of the sqlite adapter with same file "${config.databaseFile}" not allowed`
        )
      } else {
        log.error(errorToThrow.message)
        log.verbose(errorToThrow.stack)
      }
      throw errorToThrow
    }
  }

  log.debug('databases are initialized')
}

export default init
