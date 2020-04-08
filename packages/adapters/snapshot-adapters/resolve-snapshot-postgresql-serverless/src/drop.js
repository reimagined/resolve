import { ResourceNotExistError } from 'resolve-snapshot-base'

const drop = async pool => {
  try {
    await pool.executeStatement(`DROP TABLE ${pool.escapeId(pool.tableName)}`)
  } catch (error) {
    if (error != null && /Table.*? does not exist$/i.test(error.message)) {
      throw new ResourceNotExistError(
        `Double-free snapshot-postgresql-serverless adapter via "${pool.databaseName}" failed`
      )
    } else {
      throw error
    }
  }
}

export default drop
