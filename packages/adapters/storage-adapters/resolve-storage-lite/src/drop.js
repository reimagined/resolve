import { ResourceNotExistError } from 'resolve-storage-base'

const drop = async ({ database, tableName, escapeId, memoryStore, config }) => {
  try {
    await database.exec(
      `DROP TABLE IF EXISTS ${escapeId(`${tableName}-freeze`)}`
    )
    await database.exec(`DROP TABLE ${escapeId(tableName)}`)
  } catch (error) {
    if (
      error != null &&
      /^SQLITE_ERROR: no such table.*?$/.test(error.message)
    ) {
      throw new ResourceNotExistError(
        `Double-free storage-lite adapter via "${config.databaseFile}" failed`
      )
    } else {
      throw error
    }
  } finally {
    if (memoryStore != null) {
      try {
        await memoryStore.drop()
      } catch (e) {}
    }
  }
}

export default drop
