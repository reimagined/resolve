import { EventstoreResourceAlreadyExistError } from './js/base-imports'
import getLog from './js/get-log'
import initEventStore from './js/init'
import { AdapterPool } from './types'
import {
  longNumberSqlType,
  uuidSqlType,
  longStringSqlType
} from './js/constants'

const initSecretsStore = async (pool: AdapterPool): Promise<any> => {
  const {
    secrets: { database, tableName, connection },
    escapeId
  } = pool
  const log = getLog('initSecretsStore')

  log.verbose(`tableName: ${tableName}`)
  log.verbose(`database: ${database}`)

  log.debug(`initializing secrets store database tables`)

  const secretsTableNameAsId = escapeId(tableName)

  log.debug(`building a query`)

  const query = `CREATE TABLE ${secretsTableNameAsId}(
        \`idx\` ${longNumberSqlType},
        \`id\` ${uuidSqlType},
        \`secret\` ${longStringSqlType},
        PRIMARY KEY(\`id\`, \`idx\`)
      );`

  try {
    log.debug(`executing query`)
    log.verbose(query)
    await connection.query(query)
    log.debug(`query executed successfully`)
  } catch (error) {
    if (error) {
      let errorToThrow = error
      if (/Table.*? already exists$/i.test(error.message)) {
        errorToThrow = new EventstoreResourceAlreadyExistError(
          `duplicate initialization of the mysql adapter with same secrets database "${database}" and table "${tableName}" not allowed`
        )
      } else {
        log.error(errorToThrow.message)
        log.verbose(errorToThrow.stack)
      }
      throw errorToThrow
    }
  }
  log.debug(`secrets store database tables are initialized`)
}

const init = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('init')
  log.debug('initializing databases')
  const result = await Promise.all([
    initEventStore(pool),
    initSecretsStore(pool)
  ])
  log.debug('databases are initialized')
  return result
}

export default init
