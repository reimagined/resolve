import { EventstoreResourceNotExistError } from '@resolve-js/eventstore-base'
import { getLog } from './get-log'
import { AdapterPool } from './types'
import { isNotExistError } from './resource-errors'
import executeSequence from './execute-sequence'

const dropSecrets = async (pool: AdapterPool): Promise<any[]> => {
  const log = getLog('dropSecrets')

  const { secretsTableName, database, escapeId } = pool

  log.debug(`dropping secrets`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  const secretsTableNameAsId: string = escapeId(secretsTableName)

  const statements: string[] = [`DROP TABLE ${secretsTableNameAsId}`]

  const errors: any[] = await executeSequence(
    pool,
    statements,
    log,
    (error) => {
      if (isNotExistError(error)) {
        return new EventstoreResourceNotExistError(
          `mysql adapter for database "${database}" already dropped`
        )
      }
      return null
    }
  )

  log.debug(`finished dropping secrets`)
  return errors
}

export default dropSecrets
