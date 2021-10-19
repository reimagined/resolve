import { EventstoreResourceAlreadyExistError } from '@resolve-js/eventstore-base'
import { AGGREGATE_ID_SQL_TYPE } from './constants'
import { getLog } from './get-log'
import { AdapterPool } from './types'
import executeSequence from './execute-sequence'
import { isAlreadyExistsError } from './resource-errors'

const initSecrets = async ({
  executeQuery,
  databaseFile,
  secretsTableName,
  escapeId,
}: AdapterPool): Promise<any[]> => {
  const log = getLog('initSecrets')
  log.debug('initializing secrets table')

  const secretsTableNameAsId = escapeId(secretsTableName)

  const statements: string[] = [
    `CREATE TABLE ${secretsTableNameAsId} (
      ${escapeId('idx')} BIG INT NOT NULL UNIQUE,
      ${escapeId('id')} ${AGGREGATE_ID_SQL_TYPE} NOT NULL PRIMARY KEY,
      ${escapeId('secret')} text
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ${escapeId(
      'idx-index'
    )} ON ${secretsTableNameAsId}(
      ${escapeId('idx')}
    )`,
  ]

  const errors: any[] = await executeSequence(
    executeQuery,
    statements,
    log,
    (error) => {
      if (isAlreadyExistsError(error.message)) {
        return new EventstoreResourceAlreadyExistError(
          `duplicate initialization of the sqlite adapter with the same event database "${databaseFile}" and table "${secretsTableName}" is not allowed`
        )
      }
      return null
    }
  )

  log.debug('finished initializing secrets table')
  return errors
}

export default initSecrets
