const init = async (pool, inputAggregateIds, key) => {
  const {
    snapshotAdapter,
    invariantHash,
    initHandler,
    eventTypes,
    eventStore,
    deserializeState,
    eventHandler
  } = pool

  const viewModel = {
    aggregatesVersionsMap: new Map(),
    lastTimestamp: -1,
    state: null,
    disposed: false
  }

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
    if (!(+viewModel.lastTimestamp > 0) && typeof initHandler === 'function') {
      viewModel.state = initHandler()
    }
  } catch (error) {
    viewModel.lastError = error
  }

  const handler = eventHandler.bind(null, pool, viewModel)

  const aggregateIds = inputAggregateIds !== '*' ? inputAggregateIds : null

  Object.assign(viewModel, {
    aggregateIds,
    handler,
    snapshotKey,
    key
  })

  await eventStore.loadEvents(
    {
      aggregateIds: viewModel.aggregateIds,
      startTime: viewModel.lastTimestamp,
      eventTypes,
      skipBus: true
    },
    viewModel.handler
  )

  return viewModel
}

export default init
