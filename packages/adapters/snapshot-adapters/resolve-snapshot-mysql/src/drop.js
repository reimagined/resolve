import { ResourceNotExistError } from 'resolve-snapshot-base'

const drop = async pool => {
  try {
    await pool.connection.execute(`DROP TABLE ${pool.escapeId(pool.tableName)}`)
  } catch (error) {
    if (error != null && /Unknown table/i.test(error.message)) {
      throw new ResourceNotExistError(
        `Double-free snapshot-mysql adapter via "${pool.config.database}" failed`
      )
    } else {
      throw error
    }
  }
}

export default drop
