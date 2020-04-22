import { ResourceAlreadyExistError } from 'resolve-snapshot-base'

const init = async pool => {
  try {
    await pool.database.exec(
      `CREATE TABLE ${pool.escapeId(pool.tableName)} (
        ${pool.escapeId('snapshotKey')} TEXT,
        ${pool.escapeId('content')} TEXT
        )`
    )
  } catch (error) {
    if (
      error != null &&
      /^SQLITE_ERROR:.*? already exists$/.test(error.message)
    ) {
      throw new ResourceAlreadyExistError(
        `Double-initialize storage-lite adapter via "${pool.config.databaseFile}" failed`
      )
    } else {
      throw error
    }
  }
}

export default init
