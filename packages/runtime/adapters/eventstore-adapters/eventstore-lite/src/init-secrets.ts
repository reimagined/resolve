import { EventstoreResourceAlreadyExistError } from '@resolve-js/eventstore-base'
import { AGGREGATE_ID_SQL_TYPE } from './constants'
import getLog from './get-log'
import { AdapterPool } from './types'
import executeSequence from './execute-sequence'
import { isAlreadyExistsError } from './resource-errors'

const initSecrets = async ({
  database,
  databaseFile,
  secretsTableName,
  escapeId,
}: AdapterPool): Promise<any[]> => {
  const log = getLog('initSecrets')
  log.debug('initializing secrets table')

  const statements: string[] = [
    `CREATE TABLE ${escapeId(secretsTableName)} (
      ${escapeId('idx')} BIG INT NOT NULL,
      ${escapeId('id')} ${AGGREGATE_ID_SQL_TYPE} NOT NULL,
      ${escapeId('secret')} text,
      PRIMARY KEY(${escapeId('id')}, ${escapeId('idx')})
    )`,
  ]

  const errors: any[] = await executeSequence(
    database,
    statements,
    log,
    (error) => {
      if (isAlreadyExistsError(error.message)) {
        return new EventstoreResourceAlreadyExistError(
          `duplicate initialization of the sqlite adapter with same events database "${databaseFile}" and table "${secretsTableName}" is not allowed`
        )
      }
      return null
    }
  )

  log.debug('finished initializing secrets table')
  return errors
}

export default initSecrets
