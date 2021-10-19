import { EventstoreResourceAlreadyExistError } from '@resolve-js/eventstore-base'
import { getLog } from './get-log'
import { AdapterPool } from './types'
import {
  AGGREGATE_ID_SQL_TYPE,
  INT8_SQL_TYPE,
  JSON_SQL_TYPE,
  LONG_NUMBER_SQL_TYPE,
  LONG_STRING_SQL_TYPE,
  TEXT_SQL_TYPE,
} from './constants'
import executeSequence from './execute-sequence'
import { isAlreadyExistsError } from './resource-errors'

const initEvents = async ({
  databaseName,
  eventsTableName,
  snapshotsTableName,
  subscribersTableName,
  executeStatement,
  escapeId,
}: AdapterPool): Promise<any[]> => {
  const log = getLog('initEvents')

  log.debug(`initializing events tables`)
  log.verbose(`eventsTableName: ${eventsTableName}`)
  log.verbose(`databaseName: ${databaseName}`)

  const databaseNameAsId: string = escapeId(databaseName)

  const eventsTableNameAsId: string = escapeId(eventsTableName)
  const threadsTableNameAsId: string = escapeId(`${eventsTableName}-threads`)
  const snapshotsTableNameAsId: string = escapeId(snapshotsTableName)
  const subscribersTableNameAsId: string = escapeId(subscribersTableName)

  const aggregateIdAndVersionIndexName: string = escapeId(
    `${eventsTableName}-aggregateIdAndVersion`
  )
  const aggregateIndexName: string = escapeId(`${eventsTableName}-aggregateId`)
  const aggregateVersionIndexName: string = escapeId(
    `${eventsTableName}-aggregateVersion`
  )
  const typeIndexName: string = escapeId(`${eventsTableName}-type`)
  const timestampIndexName: string = escapeId(`${eventsTableName}-timestamp`)

  const statements: string[] = [
    `CREATE TABLE ${databaseNameAsId}.${eventsTableNameAsId}(
      "threadId" ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      "threadCounter" ${INT8_SQL_TYPE} NOT NULL,
      "timestamp" ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      "aggregateId" ${AGGREGATE_ID_SQL_TYPE} NOT NULL,
      "aggregateVersion" ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      "type" ${LONG_STRING_SQL_TYPE} NOT NULL,
      "payload" ${JSON_SQL_TYPE},
      "eventSize" ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      PRIMARY KEY("threadId", "threadCounter")
    )`,
    `CREATE UNIQUE INDEX ${aggregateIdAndVersionIndexName}
    ON ${databaseNameAsId}.${eventsTableNameAsId}
    USING BTREE("aggregateId", "aggregateVersion")`,
    `CREATE INDEX ${aggregateIndexName}
    ON ${databaseNameAsId}.${eventsTableNameAsId}
    USING BTREE("aggregateId")`,
    `CREATE INDEX ${aggregateVersionIndexName}
    ON ${databaseNameAsId}.${eventsTableNameAsId}
    USING BTREE("aggregateVersion")`,
    `CREATE INDEX ${typeIndexName}
    ON ${databaseNameAsId}.${eventsTableNameAsId}
    USING BTREE("type")`,
    `CREATE INDEX ${timestampIndexName}
    ON ${databaseNameAsId}.${eventsTableNameAsId}
    USING BTREE("timestamp")`,
    `CREATE TABLE ${databaseNameAsId}.${snapshotsTableNameAsId} (
      "snapshotKey" ${TEXT_SQL_TYPE} NOT NULL,
      "snapshotContent" ${TEXT_SQL_TYPE},
      PRIMARY KEY("snapshotKey")
    )`,
    `CREATE TABLE ${databaseNameAsId}.${threadsTableNameAsId}(
      "threadId" ${LONG_NUMBER_SQL_TYPE} NOT NULL,
      "threadCounter" ${LONG_NUMBER_SQL_TYPE} NOT NULL,
    PRIMARY KEY("threadId")
    )`,
    `INSERT INTO ${databaseNameAsId}.${threadsTableNameAsId}(
      "threadId",
      "threadCounter"
    ) VALUES ${Array.from(new Array(256))
      .map((_, index) => `(${index}, 0)`)
      .join(',')}`,
    `CREATE TABLE ${databaseNameAsId}.${subscribersTableNameAsId}(
      "applicationName" ${LONG_STRING_SQL_TYPE} NOT NULL,
      "eventSubscriber" ${LONG_STRING_SQL_TYPE} NOT NULL,
      "destination" ${JSON_SQL_TYPE} NOT NULL, 
      "status" ${JSON_SQL_TYPE} NOT NULL, 
      PRIMARY KEY("applicationName", "eventSubscriber")
    )`,
  ]

  const errors: any[] = await executeSequence(
    executeStatement,
    statements,
    log,
    (error) => {
      if (isAlreadyExistsError(error)) {
        return new EventstoreResourceAlreadyExistError(
          `duplicate initialization of the postgresql event store on database "${databaseName}" and table ${eventsTableName} is not allowed`
        )
      }
      return null
    }
  )

  log.debug('finished initializing events tables')
  return errors
}

export default initEvents
