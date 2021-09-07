import { EventstoreResourceAlreadyExistError } from '@resolve-js/eventstore-base'
import { AGGREGATE_ID_SQL_TYPE } from './constants'
import { getLog } from './get-log'
import { AdapterPool } from './types'
import executeSequence from './execute-sequence'
import { isAlreadyExistsError } from './resource-errors'

const initEvents = async ({
  executeQuery,
  databaseFile,
  eventsTableName,
  snapshotsTableName,
  subscribersTableName,
  escapeId,
}: AdapterPool): Promise<any[]> => {
  const log = getLog('initEvents')
  log.debug('initializing events tables')

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

    `CREATE TABLE ${escapeId(subscribersTableName)} (
      ${escapeId('applicationName')} VARCHAR(700) NOT NULL,
      ${escapeId('eventSubscriber')} VARCHAR(700) NOT NULL,
      ${escapeId('destination')} JSON NOT NULL,
      ${escapeId('status')} JSON NOT NULL,
      PRIMARY KEY(${escapeId('applicationName')}, ${escapeId(
      'eventSubscriber'
    )})
    )`,
  ]

  const errors: any[] = await executeSequence(
    executeQuery,
    statements,
    log,
    (error) => {
      if (isAlreadyExistsError(error.message)) {
        return new EventstoreResourceAlreadyExistError(
          `duplicate initialization of the sqlite adapter with the same event database "${databaseFile}" and table "${eventsTableName}" is not allowed`
        )
      }
      return null
    }
  )

  log.debug('finished initializing events tables')
  return errors
}

export default initEvents
