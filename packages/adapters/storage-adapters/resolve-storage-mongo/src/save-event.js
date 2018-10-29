import { ConcurrentError } from 'resolve-storage-base'

const DUPLICATE_KEY_ERROR = 11000

const saveEvent = async (pool, event) => {
  try {
    await pool.collection.insertOne(event)
  } catch (error) {
    if (error.code !== DUPLICATE_KEY_ERROR) {
      throw error
    }

    throw new ConcurrentError(
      `Can not save the event because aggregate '${
        event.aggregateId
      }' is not actual at the moment. Please retry later.`
    )
  }
}

export default saveEvent
