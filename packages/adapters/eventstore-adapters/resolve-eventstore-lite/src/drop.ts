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

  try {
    log.debug(`dropping events freeze table`)
    await database.exec(
      `DROP TABLE IF EXISTS ${escapeId(`${eventsTableName}-freeze`)}`
    )

    log.debug(`dropping events primary table`)
    await database.exec(`DROP TABLE ${escapeId(eventsTableName)}`)

    log.debug(`dropping snapshots table`)
    await database.exec(`DROP TABLE ${escapeId(snapshotsTableName)}`)

    log.debug(`event store tables are dropped`)

    await database.exec(`DROP TABLE ${escapeId(secretsTableName)}`)
  } catch (error) {
    if (error != null) {
      let errorToThrow = error
      if (/^SQLITE_ERROR: no such table.*?$/.test(error.message)) {
        errorToThrow = new EventstoreResourceNotExistError(
          `sqlite adapter for database "${config.databaseFile}" already dropped`
        )
      } else {
        log.error(errorToThrow.message)
        log.verbose(errorToThrow.stack)
      }
      throw errorToThrow
    }
  } finally {
    if (memoryStore != null) {
      try {
        await memoryStore.drop()
      } catch (e) {
        log.error(e.message)
        log.verbose(e.stack)
      }
    }
  }

  log.debug(`the event store dropped`)
}

export default drop
