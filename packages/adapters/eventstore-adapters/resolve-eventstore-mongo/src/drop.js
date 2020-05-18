import { EventstoreResourceNotExistError } from 'resolve-eventstore-base'

const drop = async ({ database, collectionName }) => {
  try {
    try {
      await database.dropCollection(`${collectionName}-freeze`)
    } catch (error) {
      if (+error.code !== 26) {
        throw error
      }
    }

    await database.dropCollection(collectionName)
  } catch (error) {
    if (error != null && +error.code === 26) {
      throw new EventstoreResourceNotExistError(
        `Double-free eventstore-mongo adapter via "${collectionName}" failed`
      )
    } else {
      throw error
    }
  }
}

export default drop
