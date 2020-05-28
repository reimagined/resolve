import { EventstoreResourceAlreadyExistError } from 'resolve-eventstore-base'
import getLog from './js/get-log'
import initEventStore from './js/init'
import { AdapterPool } from './types'

const initSecretsStore = async (pool: AdapterPool): Promise<any> => {
  const { secretsTableName, escapeId, databaseName, executeStatement } = pool
  const log = getLog('initSecretsStore')

  if (!secretsTableName || !escapeId || !databaseName || !executeStatement) {
    const error = Error(`adapter pool was not initialized properly!`)
    log.error(error.message)
    log.verbose(error.stack || error.message)
    throw error
  }

  log.debug(`initializing secrets store database tables`)
  log.verbose(`secretsTableName: ${secretsTableName}`)
  log.verbose(`databaseName: ${databaseName}`)

  const databaseNameAsId = escapeId(databaseName)
  const secretsTableNameAsId = escapeId(secretsTableName)
  const globalIndexName = escapeId(`${secretsTableName}-global`)

  try {
    await executeStatement(
      `CREATE TABLE IF NOT EXISTS ${databaseNameAsId}.${secretsTableNameAsId} (
        "idx" BIGSERIAL,
        "id" uuid NOT NULL PRIMARY KEY,
        "secret" text COLLATE pg_catalog."default"
       );
       CREATE UNIQUE INDEX IF NOT EXISTS ${globalIndexName}
       ON ${databaseNameAsId}.${secretsTableNameAsId}
       ("idx");`
    )
  } catch (error) {
    if (error) {
      let errorToThrow = error
      if (/Relation.*? already exists$/i.test(error.message)) {
        errorToThrow = new EventstoreResourceAlreadyExistError(
          `duplicate initialization of the postgresql-serverless secrets store with the same parameters not allowed`
        )
      }
      log.error(errorToThrow.message)
      log.verbose(errorToThrow.stack)
      throw errorToThrow
    }
  }

  log.debug(`secrets store database tables are initialized`)
}

const init = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('init')
  log.debug('initializing databases')

  const { databaseName, tableName, executeStatement, escapeId } = pool

  const createInitEventStorePromise = (): Promise<any> =>
    databaseName && tableName && executeStatement && escapeId
      ? initEventStore({
          databaseName,
          tableName,
          executeStatement,
          escapeId
        })
      : Promise.resolve()

  const result = await Promise.all([
    createInitEventStorePromise(),
    initSecretsStore(pool)
  ])

  log.debug('databases are initialized')
  return result
}

export default init
