import { ResourceAlreadyExistError } from 'resolve-snapshot-base'

const init = async pool => {
  try {
    const database = await pool.client.db()
    const collection = await database.collection(pool.config.tableName, {
      strict: true
    })

    await collection.createIndex('snapshotKey')
    await collection.createIndex('content')
  } catch (error) {
    if (error != null && /collection.*? already exists/i.test(error.message)) {
      throw new ResourceAlreadyExistError(
        `Double-initialize snapshot-mongo adapter via "${pool.config.databaseFile}" failed`
      )
    } else {
      throw error
    }
  }
}

export default init
