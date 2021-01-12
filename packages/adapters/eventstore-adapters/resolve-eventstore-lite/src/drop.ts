import { EventstoreResourceNotExistError } from 'resolve-eventstore-base'
import getLog from './get-log'
import { AdapterPool } from './types'

const drop = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('drop')
  log.debug(`dropping the event store`)

  const {
    database,
    eventsTableName,
    snapshotsTableName,
    secretsTableName,
    escapeId,
    memoryStore,
    config,
  } = pool

  const errors: any[] = []
  const statements: string[] = [
    `DROP TABLE IF EXISTS ${escapeId(`${eventsTableName}-freeze`)}`,
    `DROP TABLE ${escapeId(eventsTableName)}`,
    `DROP TABLE ${escapeId(snapshotsTableName)}`,
    `DROP TABLE ${escapeId(secretsTableName)}`,
  ]

  for (const statement of statements) {
    try {
      log.debug(`executing query`)
      log.verbose(statement)
      await database.exec(statement)
      log.debug(`query executed successfully`)
    } catch (error) {
      if (error != null) {
        let errorToThrow = error
        if (/^SQLITE_ERROR: no such (?:table|(?:Table|Index)).*?$/.test(error.message)) {
          errorToThrow = new EventstoreResourceNotExistError(
            `sqlite adapter for database "${config.databaseFile}" already dropped`
          )
        } else {
          log.error(errorToThrow.message)
          log.verbose(errorToThrow.stack)
        }
        errors.push(errorToThrow)
      }
    } finally {
      if (memoryStore != null) {
        try {
          await memoryStore.drop()
        } catch (e) {
          log.error(e.message)
          log.verbose(e.stack)
          errors.push(e)
        }
      }
    }
  }

  pool.maybeThrowResourceError(errors)

  log.debug(`the event store dropped`)
}

export default drop
