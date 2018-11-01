const EVENT_OUTDATED = 'EVENT_OUTDATED'
const EVENT_OUT_OF_ORDER = 'EVENT_OUT_OF_ORDER'
const EVENT_SUCCESS = 'EVENT_SUCCESS'

const eventHandler = async (
  { projection, snapshotAdapter, serializeState },
  viewModel,
  event,
  maybeUnordered
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
      return EVENT_OUTDATED
    }

    if (
      maybeUnordered &&
      !(
        (expectedAggregateVersion == null && event.aggregateVersion === 1) ||
        expectedAggregateVersion + 1 === event.aggregateVersion
      )
    ) {
      return EVENT_OUT_OF_ORDER
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
        lastTimestamp: viewModel.lastTimestamp,
        state: serializeState(viewModel.state)
      })
    }

    return EVENT_SUCCESS
  } catch (error) {
    viewModel.lastError = error
    throw error
  }
}

export default eventHandler
