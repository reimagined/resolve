const updateByEvents = async (
  repository,
  { aggregateIds } = {},
  events,
  refreshFromStorage = false
) => {
  if (!Array.isArray(events)) {
    throw new Error('Updating by events should supply events array')
  }

  try {
    const viewModel = repository.getViewModel(
      repository,
      aggregateIds,
      true,
      !refreshFromStorage
    )
    await viewModel.initPromise

    for (const event of events) {
      await viewModel.handler(event)
    }
  } catch (error) {
    return null
  }
}

export default updateByEvents
