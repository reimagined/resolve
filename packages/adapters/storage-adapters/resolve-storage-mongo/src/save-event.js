import { ConcurrentError } from 'resolve-storage-base'

const DUPLICATE_KEY_ERROR = 11000

const saveEvent = async ({ collection, isFrozen }, event) => {
  if (await isFrozen()) {
    throw new Error('Event store is frozen')
  }
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
