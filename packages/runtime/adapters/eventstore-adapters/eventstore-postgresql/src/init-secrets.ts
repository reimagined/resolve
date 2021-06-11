import { EventstoreResourceAlreadyExistError } from '@resolve-js/eventstore-base'
import { getLog } from './get-log'
import { AdapterPool } from './types'
import { AGGREGATE_ID_SQL_TYPE } from './constants'
import executeSequence from './execute-sequence'
import { isAlreadyExistsError } from './resource-errors'

const initSecrets = async ({
  databaseName,
  secretsTableName,
  eventsTableName,
  snapshotsTableName,
  executeStatement,
  escapeId,
}: AdapterPool): Promise<any[]> => {
  const log = getLog('initSecrets')

  log.debug(`initializing events tables`)
  log.verbose(`secretsTableName: ${secretsTableName}`)
  log.verbose(`databaseName: ${databaseName}`)

  const databaseNameAsId: string = escapeId(databaseName)
  const secretsTableNameAsId: string = escapeId(secretsTableName)
  const globalIndexName: string = escapeId(`${secretsTableName}-global`)

  const statements: string[] = [
    `CREATE TABLE IF NOT EXISTS ${databaseNameAsId}.${secretsTableNameAsId} (
      "idx" BIGSERIAL,
      "id" ${AGGREGATE_ID_SQL_TYPE} NOT NULL PRIMARY KEY,
      "secret" text COLLATE pg_catalog."default"
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ${globalIndexName}
       ON ${databaseNameAsId}.${secretsTableNameAsId}
       ("idx")`,
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

export default initSecrets
