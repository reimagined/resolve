import { ResourceAlreadyExistError } from 'resolve-storage-base'

const init = async ({ database, collectionName }) => {
  try {
    await database.createCollection(collectionName, { strict: true })
    const collection = await database.collection(collectionName)
    await collection.createIndex(
      { threadId: 1, threadCounter: 1 },
      { unique: true }
    )
    await collection.createIndex('timestamp')
    await collection.createIndex('aggregateId')
    await collection.createIndex(
      { aggregateId: 1, aggregateVersion: 1 },
      { unique: true }
    )
  } catch (error) {
    if (error != null && /collection.*? already exists/i.test(error.message)) {
      throw new ResourceAlreadyExistError(
        `Double-initialize storage-mongo adapter via "${collectionName}" failed`
      )
    } else {
      throw error
    }
  }
}

export default init
