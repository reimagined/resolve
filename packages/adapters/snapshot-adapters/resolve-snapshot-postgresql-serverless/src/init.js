import { ResourceAlreadyExistError } from 'resolve-snapshot-base'

const init = async pool => {
  try {
    await pool.executeStatement(`CREATE TABLE IF NOT EXISTS ${pool.escapeId(
      pool.databaseName
    )}.${pool.escapeId(pool.tableName)} (
    ${pool.escapeId('SnapshotKey')} text NOT NULL,
    ${pool.escapeId('SnapshotContent')} text,
    PRIMARY KEY(${pool.escapeId('SnapshotKey')})
  )`)
  } catch (error) {
    if (error != null && /Relation.*? already exists$/i.test(error.message)) {
      throw new ResourceAlreadyExistError(
        `Double-initialize snapshot-postgresql-serverless adapter via "${pool.databaseName}" failed`
      )
    } else {
      throw error
    }
  }
}

export default init
