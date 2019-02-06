import { readActivityTime, writeActivityTime } from '../constants'

const updateByEvents = async (repository, events) => {
  if (!Array.isArray(events)) {
    throw new Error('Updating by events should supply events array')
  }
  if (repository.disposePromise) {
    throw new Error('Read model is disposed')
  }
  if (repository.projection == null) {
    throw new Error(
      'Updating by events is prohibited when projection is not specified'
    )
  }

  await repository.connect(repository)
  const lastDemandAccess = await repository.metaApi.pollDemandAccess()
  let lastProjectionAction = Number(await repository.metaApi.getLastTimestamp())
  if (isNaN(lastProjectionAction)) {
    lastProjectionAction = 0
  }

  const currentTime = Date.now()
  const readElapsedTime = Math.max(currentTime - lastDemandAccess, 0)
  const writeElapsedTime = Math.max(currentTime - lastProjectionAction, 0)

  if (readElapsedTime > readActivityTime) {
    return
  }

  if (writeElapsedTime > writeActivityTime) {
    try {
      await repository.loadEvents(repository)
    } catch (err) {}
  }

  try {
    let hasReorderedEvents = false

    for (const event of events) {
      if (repository.eventTypes.indexOf(event.type) < 0) continue
      const applyResult = await repository.boundProjectionInvoker(event, true)

      if (applyResult === 'REORDERED_EVENT') {
        hasReorderedEvents = true
        break
      }
    }

    if (hasReorderedEvents) {
      await repository.loadEvents(repository)
    }
  } catch (err) {}
}

export default updateByEvents
