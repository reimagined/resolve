const updateByEvents = async (repository, events) => {
  if (!Array.isArray(events)) {
    throw new Error('Updating by events should supply events array')
  }

  const forceUpdateFromStorage = repository.getModelReadInterface.bind(
    null,
    repository,
    false
  )

  for (const event of events) {
    try {
      if (repository.eventTypes.indexOf(event.type) < 0) continue

      const eventApplyingResult = await repository.boundProjectionInvoker(
        event,
        true
      )

      if (eventApplyingResult === 'EVENT_OUT_OF_ORDER') {
        await forceUpdateFromStorage()
      }
    } catch (error) {
      return error
    }
  }
}

export default updateByEvents
