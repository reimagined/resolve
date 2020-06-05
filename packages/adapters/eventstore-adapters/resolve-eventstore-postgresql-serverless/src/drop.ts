import { EOL } from 'os'
import { EventstoreResourceNotExistError } from 'resolve-eventstore-base'
import getLog from './js/get-log'
import dropEventStore from './js/drop'
import { AdapterPool } from './types'

const dropSecretsStore = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('dropSecretsStore')

  log.debug(`dropping secrets store database tables`)
  const { secretsTableName, databaseName, executeStatement, escapeId } = pool
  log.verbose(`secretsTableName: ${secretsTableName}`)

  if (!secretsTableName || !escapeId || !databaseName || !executeStatement) {
    const error = Error(`adapter pool was not initialized properly!`)
    log.error(error.message)
    log.verbose(error.stack || error.message)
    throw error
  }

  log.debug(`dropping secrets store database tables and indices`)
  log.verbose(`secretsTableName: ${secretsTableName}`)
  log.verbose(`databaseName: ${databaseName}`)

  const databaseNameAsId = escapeId(databaseName)
  const secretsTableNameAsId = escapeId(secretsTableName)
  const globalIndexName = escapeId(`${secretsTableName}-global`)

  const statements = [
    `DROP TABLE ${databaseNameAsId}.${secretsTableNameAsId}`,
    `DROP INDEX IF EXISTS ${databaseNameAsId}.${globalIndexName}`
  ]

  const errors = []

  for (const statement of statements) {
    try {
      await executeStatement(statement)
    } catch (error) {
      if (error != null) {
        log.error(error.message)
        log.verbose(error.stack)
        if (/Table.*? does not exist$/i.test(error.message)) {
          throw new EventstoreResourceNotExistError(
            `duplicate event store resource drop detected`
          )
        }
        errors.push(error)
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.map(error => error.stack).join(EOL))
  }

  log.debug(`secrets store database tables and indices are dropped`)
}

const drop = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('drop')

  const { databaseName, eventsTableName, snapshotsTableName, executeStatement, escapeId } = pool

  const createDropEventStorePromise = (): Promise<any> => dropEventStore({
    databaseName,
    eventsTableName,
    snapshotsTableName,
    executeStatement,
    escapeId
  })

  log.debug(`dropping the event store`)
  await Promise.all([createDropEventStorePromise(), dropSecretsStore(pool)])
  log.debug(`the event store dropped`)
}

export default drop
