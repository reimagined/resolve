import { EventstoreResourceAlreadyExistError } from '@resolve-js/eventstore-base'
import getLog from './get-log'
import { AdapterPool } from './types'
import { AGGREGATE_ID_SQL_TYPE } from './constants'
import { isAlreadyExistsError } from './resource-errors'
import executeSequence from './execute-sequence'

const initSecrets = async ({
  databaseName,
  secretsTableName,
  executeStatement,
  escapeId,
}: AdapterPool): Promise<any[]> => {
  const log = getLog('initSecrets')
  log.debug(`initializing secrets table`)
  log.verbose(`secretsTableName: ${secretsTableName}`)
  log.verbose(`databaseName: ${databaseName}`)

  const databaseNameAsId: string = escapeId(databaseName)
  const secretsTableNameAsId: string = escapeId(secretsTableName)
  const globalIndexName: string = escapeId(`${secretsTableName}-global`)

  const statements = [
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
      if (isAlreadyExistsError(error.message)) {
        return new EventstoreResourceAlreadyExistError(
          `duplicate initialization of the postgresql-serverless event store on database "${databaseName}" and table "${secretsTableName}" is not allowed`
        )
      }
      return null
    }
  )

  log.debug('finished initializing secrets table')
  return errors
}

export default initSecrets
