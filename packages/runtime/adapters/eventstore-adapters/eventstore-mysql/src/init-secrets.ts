import { EventstoreResourceAlreadyExistError } from '@resolve-js/eventstore-base'
import { getLog } from './get-log'
import { AdapterPool } from './types'
import {
  longNumberSqlType,
  longStringSqlType,
  aggregateIdSqlType,
} from './constants'
import { isAlreadyExistsError } from './resource-errors'
import executeSequence from './execute-sequence'

const initSecrets = async (pool: AdapterPool): Promise<any[]> => {
  const log = getLog('initSecrets')
  log.debug('initializing secrets table')
  const { secretsTableName, escapeId, connection, database } = pool

  const secretsTableNameAsId = escapeId(secretsTableName)

  const statements: string[] = [
    `CREATE TABLE ${secretsTableNameAsId}(
      \`idx\` ${longNumberSqlType},
      \`id\` ${aggregateIdSqlType},
      \`secret\` ${longStringSqlType},
      PRIMARY KEY(\`id\`, \`idx\`)
    )`,
  ]

  const errors: any[] = await executeSequence(
    connection,
    statements,
    log,
    (error) => {
      if (isAlreadyExistsError(error)) {
        return new EventstoreResourceAlreadyExistError(
          `duplicate initialization of the mysql adapter with the same event database "${database}" and table "${secretsTableName}" is not allowed`
        )
      }
      return null
    }
  )

  log.debug('finished initializing secrets table')
  return errors
}

export default initSecrets
