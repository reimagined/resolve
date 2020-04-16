import { ResourceAlreadyExistError } from 'resolve-snapshot-base'

const init = async pool => {
  try {
    await pool.connection.execute(`CREATE TABLE IF NOT EXISTS ${pool.escapeId(
      pool.tableName
    )} (
      ${pool.escapeId('SnapshotKey')} MEDIUMBLOB NOT NULL,
      ${pool.escapeId('SnapshotContent')} LONGBLOB,
      PRIMARY KEY(${pool.escapeId('SnapshotKey')}(255))
    )`)
  } catch (error) {
    if (error != null && /Table.*? already exists$/i.test(error.message)) {
      throw new ResourceAlreadyExistError(
        `Double-initialize snapshot-mysql adapter via "${pool.config.database}" failed`
      )
    } else {
      throw error
    }
  }
}

export default init
