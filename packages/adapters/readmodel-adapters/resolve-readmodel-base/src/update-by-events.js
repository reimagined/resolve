export const readActivityTime = 1000 * 60 * 60
export const writeActivityTime = 1000 * 60 * 60

const updateByEvents = async (readModel, events) => {
  if (!Array.isArray(events)) {
    throw new Error('Updating by events should supply events array')
  }
  if (readModel.disposePromise) {
    throw new Error('Read model is disposed')
  }
  if (readModel.projection == null) {
    throw new Error(
      'Updating by events is prohibited when projection is not specified'
    )
  }

  const lastDemandAccess = await readModel.metaApi.pollDemandAccess()
  let lastProjectionAction = Number(await readModel.metaApi.getLastTimestamp())
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
      await readModel.loadEvents(readModel)
    } catch (err) {}
  }

  try {
    let hasReorderedEvents = false

    for (const event of events) {
      if (readModel.eventTypes.indexOf(event.type) < 0) continue
      const applyResult = await readModel.boundProjectionInvoker(event, true)

      if (applyResult === 'REORDERED_EVENT') {
        hasReorderedEvents = true
        break
      }
    }

    if (hasReorderedEvents) {
      await readModel.loadEvents(readModel)
    }
  } catch (err) {}
}

export default updateByEvents
