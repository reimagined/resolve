import { EventstoreResourceAlreadyExistError } from 'resolve-eventstore-base'
import getLog from './get-log'
import { AdapterPool } from './types'
import {
  AGGREGATE_ID_SQL_TYPE,
  INT8_SQL_TYPE,
  JSON_SQL_TYPE,
  LONG_NUMBER_SQL_TYPE,
  LONG_STRING_SQL_TYPE,
  TEXT_SQL_TYPE,
} from './constants'

const init = async ({
  databaseName,
  secretsTableName,
  eventsTableName,
  snapshotsTableName,
  executeStatement,
  escapeId,
  maybeThrowResourceError,
}: AdapterPool): Promise<void> => {
  const log = getLog('initSecretsStore')

  log.debug(`initializing secrets store database tables`)
  log.verbose(`secretsTableName: ${secretsTableName}`)
  log.verbose(`databaseName: ${databaseName}`)

  const databaseNameAsId: string = escapeId(databaseName)
  const secretsTableNameAsId: string = escapeId(secretsTableName)
  const globalIndexName: string = escapeId(`${secretsTableName}-global`)

  const eventsTableNameAsId: string = escapeId(eventsTableName)
  const threadsTableNameAsId: string = escapeId(`${eventsTableName}-threads`)
  const snapshotsTableNameAsId: string = escapeId(snapshotsTableName)

  const aggregateIdAndVersionIndexName: string = escapeId(
    `${eventsTableName}-aggregateIdAndVersion`
  )
  const aggregateIndexName: string = escapeId(`${eventsTableName}-aggregateId`)
  const aggregateVersionIndexName: string = escapeId(
    `${eventsTableName}-aggregateVersion`
  )
  const typeIndexName: string = escapeId(`${eventsTableName}-type`)
  const timestampIndexName: string = escapeId(`${eventsTableName}-timestamp`)

  const errors: any[] = []

  const statements: string[] = [
    `CREATE TABLE IF NOT EXISTS ${databaseNameAsId}.${secretsTableNameAsId} (
      "idx" BIGSERIAL,
      "id" ${AGGREGATE_ID_SQL_TYPE} NOT NULL PRIMARY KEY,
      "secret" text COLLATE pg_catalog."default"
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ${globalIndexName}
       ON ${databaseNameAsId}.${secretsTableNameAsId}
       ("idx")`,
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
  ]

  for (const statement of statements) {
    try {
      log.debug(`executing query`)
      log.verbose(statement)
      await executeStatement(statement)
      log.debug(`query executed successfully`)
    } catch (error) {
      if (error != null && `${error.code}` === '42P07') {
        throw new EventstoreResourceAlreadyExistError(
          `Double-initialize storage-postgresql adapter via "${databaseName}" failed`
        )
      } else {
        log.error(error.message)
        log.verbose(error.stack)
      }
      errors.push(error)
    }
  }

  maybeThrowResourceError(errors)

  log.debug('databases are initialized')
}

export default init
