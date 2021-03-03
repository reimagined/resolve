import { EventstoreResourceNotExistError } from '@resolve-js/eventstore-base'
import getLog from './get-log'
import { AdapterPool } from './types'
import { isNotExistError } from './resource-errors'
import executeSequence from './execute-sequence'

const dropSecrets = async ({
  databaseName,
  executeStatement,
  escapeId,
  secretsTableName,
}: AdapterPool): Promise<any[]> => {
  const log = getLog('dropSecrets')

  log.debug(`dropping secrets`)
  log.verbose(`secretsTableName: ${secretsTableName}`)
  log.verbose(`databaseName: ${databaseName}`)

  const secretsTableNameAsId: string = escapeId(secretsTableName)
  const globalIndexName: string = escapeId(`${secretsTableName}-global`)
  const databaseNameAsId: string = escapeId(databaseName)

  const statements: string[] = [
    `DROP TABLE ${databaseNameAsId}.${secretsTableNameAsId}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${globalIndexName}`,
  ]

  const errors: any[] = await executeSequence(
    executeStatement,
    statements,
    log,
    (error) => {
      if (isNotExistError(error.message)) {
        return new EventstoreResourceNotExistError(
          `postgresql-serverless adapter for database "${databaseName}" already dropped`
        )
      }
      return null
    }
  )

  log.debug(`finished dropping secrets`)
  return errors
}

export default dropSecrets
