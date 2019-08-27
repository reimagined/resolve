import { ConcurrentError } from 'resolve-storage-base'

const DUPLICATE_KEY_ERROR = 11000

const saveEvent = async ({ collection }, event) => {
  try {
    await collection.insertOne(event)
  } catch (error) {
    if (error.code !== DUPLICATE_KEY_ERROR) {
      throw error
    }

    throw new ConcurrentError(event.aggregateId)
  }
}

export default saveEvent
