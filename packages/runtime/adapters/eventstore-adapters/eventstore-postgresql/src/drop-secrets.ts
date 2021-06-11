import { EventstoreResourceNotExistError } from '@resolve-js/eventstore-base'
import { getLog } from './get-log'
import { AdapterPool } from './types'
import executeSequence from './execute-sequence'
import { isNotExistError } from './resource-errors'

const dropEvents = async ({
  databaseName,
  secretsTableName,
  executeStatement,
  escapeId,
}: AdapterPool): Promise<any[]> => {
  const log = getLog('dropSecrets')

  log.debug(`dropping secrets`)
  log.verbose(`secretsTableName: ${secretsTableName}`)
  log.verbose(`databaseName: ${databaseName}`)

  const databaseNameAsId: string = escapeId(databaseName)
  const secretsTableNameAsId: string = escapeId(secretsTableName)
  const globalIndexName: string = escapeId(`${secretsTableName}-global`)

  const statements: string[] = [
    `DROP TABLE ${databaseNameAsId}.${secretsTableNameAsId}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${globalIndexName}`,
  ]
  const errors: any[] = await executeSequence(
    executeStatement,
    statements,
    log,
    (error) => {
      if (isNotExistError(error)) {
        return new EventstoreResourceNotExistError(
          `postgresql adapter for database "${databaseName}" already dropped`
        )
      }
      return null
    }
  )

  log.debug(`finished dropping secrets`)
  return errors
}

export default dropEvents
