const updateByEvents = async (repository, events) => {
  if (!Array.isArray(events)) {
    throw new Error('Updating by events should supply events array')
  }

  for (const event of events) {
    try {
      if (repository.eventTypes.indexOf(event.type) < 0) continue

      for (const viewModel of repository.viewMap.values()) {
        if (
          viewModel.aggregateIds != null &&
          viewModel.aggregateIds.indexOf(event.aggregateId) < 0
        ) {
          continue
        }
        await viewModel.initPromise

        const eventApplyingResult = await viewModel.handler(event, true)

        if (eventApplyingResult === 'EVENT_OUT_OF_ORDER') {
          await (await repository.getViewModel(
            repository,
            viewModel.aggregateIds != null ? viewModel.aggregateIds : '*',
            false
          )).initPromise
        }
      }
    } catch (error) {
      return error
    }
  }
}

export default updateByEvents
