const eventHandler = async (
  { projection, snapshotAdapter, serializeState },
  viewModel,
  event
) => {
  if (viewModel.disposed) {
    throw new Error('View model is disposed')
  } else if (viewModel.hasOwnProperty('lastError')) {
    throw viewModel.lastError
  }

  try {
    const expectedAggregateVersion = viewModel.aggregatesVersionsMap.get(
      event.aggregateId
    )
    if (
      expectedAggregateVersion != null &&
      event.aggregateVersion <= expectedAggregateVersion
    ) {
      return
    }

    viewModel.state = projection[event.type](viewModel.state, event)
    viewModel.lastTimestamp = event.timestamp - 1

    viewModel.aggregatesVersionsMap.set(
      event.aggregateId,
      event.aggregateVersion
    )

    if (snapshotAdapter != null) {
      await snapshotAdapter.saveSnapshot(viewModel.snapshotKey, {
        aggregatesVersionsMap: Array.from(viewModel.aggregatesVersionsMap),
        viewModel: viewModel.lastTimestamp,
        state: serializeState(viewModel.state)
      })
    }
  } catch (error) {
    viewModel.lastError = error
    throw error
  }
}

export default eventHandler
