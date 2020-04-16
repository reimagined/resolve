import { ResourceNotExistError } from 'resolve-snapshot-base'

const drop = async pool => {
  try {
    await pool.database.exec(`DROP TABLE ${pool.escapeId(pool.tableName)}`)
  } catch (error) {
    if (
      error != null &&
      /^SQLITE_ERROR: no such table.*?$/.test(error.message)
    ) {
      throw new ResourceNotExistError(
        `Double-free snapshot-lite adapter via "${pool.config.databaseFile}" failed`
      )
    } else {
      throw error
    }
  } finally {
    if (pool.memoryStore != null) {
      try {
        await pool.memoryStore.drop()
      } catch (e) {}
    }
  }
}

export default drop
