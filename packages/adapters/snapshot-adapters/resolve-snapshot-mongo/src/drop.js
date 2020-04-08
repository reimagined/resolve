import { ResourceNotExistError } from 'resolve-snapshot-base'

const drop = async pool => {
  try {
    const database = await pool.client.db()
    const collection = await database.collection(pool.config.tableName)
    await collection.drop()
  } catch (error) {
    if (error != null && +error.code === 26) {
      throw new ResourceNotExistError(
        `Double-free snapshot-mongo adapter via "${pool.config.databaseFile}" failed`
      )
    } else {
      throw error
    }
  }
}

export default drop
