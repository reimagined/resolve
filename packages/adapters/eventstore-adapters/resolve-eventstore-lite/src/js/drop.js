import getLog from './get-log'
import { ResourceNotExistError } from 'resolve-storage-base'

const dropEventStore = async ({
  database,
  tableName,
  escapeId,
  memoryStore,
  config
}) => {
  const log = getLog('dropEventStore')
  try {
    log.debug(`dropping events freeze table`)
    await database.exec(
      `DROP TABLE IF EXISTS ${escapeId(`${tableName}-freeze`)}`
    )

    log.debug(`dropping events primary table`)
    await database.exec(`DROP TABLE ${escapeId(tableName)}`)

    log.debug(`event store tables are dropped`)
  } catch (error) {
    if (error) {
      let errorToThrow = error
      if (/^SQLITE_ERROR: no such table.*?$/.test(error.message)) {
        errorToThrow = new ResourceNotExistError(
          `duplicate initialization of the sqlite adapter with same file "${config.databaseFile}" not allowed`
        )
      }
      log.error(errorToThrow.message)
      log.verbose(errorToThrow.stack)
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
