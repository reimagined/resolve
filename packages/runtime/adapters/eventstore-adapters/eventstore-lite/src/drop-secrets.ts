import { EventstoreResourceNotExistError } from '@resolve-js/eventstore-base'
import { getLog } from './get-log'
import { AdapterPool } from './types'
import executeSequence from './execute-sequence'
import { isNotExistError } from './resource-errors'

const dropSecrets = async ({
  executeQuery,
  databaseFile,
  secretsTableName,
  escapeId,
}: AdapterPool): Promise<any[]> => {
  const log = getLog('dropSecrets')
  log.debug(`dropping secrets`)

  const statements: string[] = [`DROP TABLE ${escapeId(secretsTableName)}`]

  const errors: any[] = await executeSequence(
    executeQuery,
    statements,
    log,
    (error) => {
      if (isNotExistError(error.message)) {
        return new EventstoreResourceNotExistError(
          `sqlite adapter for database "${databaseFile}" already dropped`
        )
      }
      return null
    }
  )

  log.debug(`finished dropping secrets`)
  return errors
}

export default dropSecrets
