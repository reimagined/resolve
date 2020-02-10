import { ConcurrentError } from 'resolve-storage-base'

const DUPLICATE_KEY_ERROR = 11000

const saveEvent = async (pool, event) => {
  const { database, collectionName, isFrozen } = pool
  if (await isFrozen()) {
    throw new Error('Event store is frozen')
  }
  try {
    const collection = await database.collection(collectionName)
    const currentThreadId = Math.floor(Math.random() * 256)

    const nextThreadCounter =
      ~~Object(
        (
          await collection
            .find({ threadId: currentThreadId })
            .sort({ threadCounter: -1 })
            .project({ threadCounter: 1 })
            .toArray()
        )[0]
      ).threadCounter + 1

    await collection.insertOne({
      ...event,
      timestamp: Math.max(event.timestamp, Date.now()),
      threadId: currentThreadId,
      threadCounter: nextThreadCounter
    })
  } catch (error) {
    const errorCode = error != null && error.code != null ? error.code : 0
    const errorMessage =
      error != null && error.message != null ? error.message : ''

    if (
      errorCode === DUPLICATE_KEY_ERROR &&
      errorMessage.indexOf('aggregate') > -1
    ) {
      throw new ConcurrentError(event.aggregateId)
    } else if (
      errorCode === DUPLICATE_KEY_ERROR &&
      errorMessage.indexOf('thread') > -1
    ) {
      return await saveEvent(pool, event)
    } else {
      throw error
    }
  }
}

export default saveEvent
