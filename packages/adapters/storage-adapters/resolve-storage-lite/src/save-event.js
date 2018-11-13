import { ConcurrentError } from 'resolve-storage-base'

const saveEvent = async ({ database, promiseInvoke }, event) => {
  try {
    await promiseInvoke(database.insert.bind(database), {
      ...event,
      aggregateIdAndVersion: `${event.aggregateId}:${event.aggregateVersion}`
    })
  } catch (error) {
    if (error.errorType !== 'uniqueViolated') {
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
