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
  } = pool

  const errors: any[] = []

  const statements: string[] = [
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
    )`,
    `CREATE INDEX ${escapeId('aggregateIdAndVersion-idx')} ON ${escapeId(
      eventsTableName
    )}(
      ${escapeId('aggregateId')}, ${escapeId('aggregateVersion')}
    )`,
    `CREATE INDEX ${escapeId('aggregateId-idx')} ON ${escapeId(
      eventsTableName
    )}(
      ${escapeId('aggregateId')}
    )`,
    `CREATE INDEX ${escapeId('aggregateVersion-idx')} ON ${escapeId(
      eventsTableName
    )}(
      ${escapeId('aggregateVersion')}
    )`,
    `CREATE INDEX ${escapeId('type-idx')} ON ${escapeId(eventsTableName)}(
      ${escapeId('type')}
    )`,
    `CREATE INDEX ${escapeId('timestamp-idx')} ON ${escapeId(eventsTableName)}(
      ${escapeId('timestamp')}
    )`,
    `CREATE TABLE ${escapeId(snapshotsTableName)} (
      ${escapeId('snapshotKey')} TEXT,
      ${escapeId('content')} TEXT,
      PRIMARY KEY(${escapeId('snapshotKey')})
      )`,
    `CREATE TABLE ${escapeId(secretsTableName)} (
      ${escapeId('idx')} BIG INT NOT NULL,
      ${escapeId('id')} ${AGGREGATE_ID_SQL_TYPE} NOT NULL,
      ${escapeId('secret')} text,
      PRIMARY KEY(${escapeId('id')}, ${escapeId('idx')})
    )`,
  ]

  for (const statement of statements) {
    try {
      log.debug(`executing query`)
      log.verbose(statement)
      await database.exec(statement)
      log.debug(`query executed successfully`)
    } catch (error) {
      if (error) {
        let errorToThrow = error
        if (/(?:Table|Index).*? already exists$/i.test(error.message)) {
          errorToThrow = new EventstoreResourceAlreadyExistError(
            `duplicate initialization of the sqlite adapter with same events database "${database}" and table "${eventsTableName}" not allowed`
          )
        } else {
          log.error(errorToThrow.message)
          log.verbose(errorToThrow.stack)
        }
        errors.push(errorToThrow)
      }
    }
  }

  pool.monitoring(errors)

  log.debug('databases are initialized')
}

export default init
