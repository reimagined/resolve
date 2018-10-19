const init = async (repository, key, inputAggregateIds, skipEventReading) => {
  const {
    viewMap,
    snapshotAdapter,
    invariantHash,
    projection,
    eventTypes,
    eventStore,
    deserializeState,
    eventHandler
  } = repository

  const viewModel = viewMap.get(key)

  if (!viewModel.handler) {
    Object.assign(viewModel, {
      aggregatesVersionsMap: new Map(),
      lastTimestamp: -1,
      state: null,
      disposed: false
    })

    const snapshotKey = `${invariantHash};${key}`

    try {
      const snapshot = await snapshotAdapter.loadSnapshot(snapshotKey)
      Object.assign(viewModel, {
        aggregatesVersionsMap: new Map(snapshot.aggregatesVersionsMap),
        lastTimestamp: snapshot.lastTimestamp,
        state: deserializeState(snapshot.state)
      })
    } catch (error) {}

    try {
      if (
        !(+viewModel.lastTimestamp > 0) &&
        typeof projection.Init === 'function'
      ) {
        viewModel.state = projection.Init()
      }
    } catch (error) {
      viewModel.lastError = error
    }

    const handler = eventHandler.bind(null, repository, viewModel)

    const aggregateIds = inputAggregateIds !== '*' ? inputAggregateIds : null

    Object.assign(viewModel, {
      aggregateIds,
      handler,
      snapshotKey,
      key
    })
  }

  if (skipEventReading) {
    return
  }

  await eventStore.loadEvents(
    {
      aggregateIds: viewModel.aggregateIds,
      startTime: viewModel.lastTimestamp,
      eventTypes,
      skipBus: true
    },
    viewModel.handler
  )

  delete viewModel.initPromise
}

export default init
