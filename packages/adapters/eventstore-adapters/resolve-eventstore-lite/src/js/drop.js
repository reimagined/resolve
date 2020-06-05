import getLog from './get-log'
import { EventstoreResourceNotExistError } from 'resolve-eventstore-base'

const dropEventStore = async ({
  database,
  eventsTableName,
  snapshotsTableName,
  escapeId,
  memoryStore,
  config
}) => {
  const log = getLog('dropEventStore')
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
  } catch (error) {
    if (error) {
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
}

export default dropEventStore
