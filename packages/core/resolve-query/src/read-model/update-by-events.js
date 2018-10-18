const updateByEvents = async (
  repository,
  events,
  refreshFromStorage = false
) => {
  if (!Array.isArray(events)) {
    throw new Error('Updating by events should supply events array')
  }

  await repository.getModelReadInterface(repository, !refreshFromStorage)

  for (const event of events) {
    try {
      await repository.boundProjectionInvoker(event)
    } catch (error) {
      return
    }
  }
}

export default updateByEvents
