const getKey = aggregateIds =>
  Array.isArray(aggregateIds) ? aggregateIds.sort().join(',') : aggregateIds

const regularHandler = async ({ eventTypes, projection }, viewModel, event) => {
  if (
    viewModel.disposed ||
    !event ||
    !event.type ||
    viewModel.lastError ||
    !eventTypes.includes(event.type)
  ) {
    return
  }

  try {
    viewModel.state = projection[event.type](viewModel.state, event)
  } catch (error) {
    viewModel.lastError = error
  }
}

const snapshotHandler = async (
  { eventTypes, projection, snapshotAdapter },
  viewModel,
  event
) => {
  if (
    viewModel.disposed ||
    !event ||
    !event.type ||
    viewModel.lastError ||
    !eventTypes.includes(event.type)
  ) {
    return
  }

  try {
    viewModel.state = projection[event.type](viewModel.state, event)
    viewModel.lastTimestamp = event.timestamp - 1

    await snapshotAdapter.saveSnapshot(viewModel.snapshotKey, {
      viewModel: viewModel.lastTimestamp,
      state: viewModel.state
    })
  } catch (error) {
    viewModel.lastError = error
  }
}

const init = async (repository, key, aggregateIds) => {
  if (
    aggregateIds !== '*' &&
    (!Array.isArray(aggregateIds) || aggregateIds.length === 0)
  ) {
    throw new Error(
      'View models are build up only with aggregateIds array or wildcard argument'
    )
  }

  const {
    viewMap,
    snapshotAdapter,
    invariantHash,
    projection,
    eventTypes,
    eventStore
  } = repository

  const viewModel = viewMap.get(key)
  Object.assign(viewModel, {
    snapshotKey: `${invariantHash};${key}`,
    aggregateIds,
    key
  })

  try {
    const snapshot = await snapshotAdapter.loadSnapshot(viewModel.snapshotKey)
    viewModel.lastTimestamp = snapshot.timestamp
    viewModel.state = snapshot.state
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

  const handler = (snapshotAdapter != null
    ? snapshotHandler
    : regularHandler
  ).bind(null, repository, viewModel)

  const unsubscribe = await (viewModel.aggregateIds === '*'
    ? eventStore.subscribeByEventType(eventTypes, handler, {
        onlyBus: false,
        startTime: viewModel.lastTimestamp
      })
    : eventStore.subscribeByAggregateId(viewModel.aggregateIds, handler, {
        onlyBus: false,
        startTime: viewModel.lastTimestamp
      }))

  viewModel.unsubscribe = unsubscribe
}

const getViewModel = (repository, aggregateIds, autoInit = false) => {
  const key = getKey(aggregateIds)

  if (!repository.viewMap.has(key) && autoInit) {
    const viewModel = {
      lastTimestamp: -1,
      lastError: null,
      state: null,
      disposed: false
    }
    repository.viewMap.set(key, viewModel)
    viewModel.initPromise = init(repository, key, aggregateIds)
  }

  return repository.viewMap.get(key)
}

const read = async (repository, { aggregateIds } = {}) => {
  const viewModel = getViewModel(repository, aggregateIds, true)
  await viewModel.initPromise
  return viewModel.state
}

const readAndSerialize = async (
  repository,
  { aggregateIds, jwtToken } = {}
) => {
  const viewModel = getViewModel(repository, aggregateIds, true)
  await viewModel.initPromise
  const serializedState = repository.serializeState(viewModel.state, jwtToken)
  return serializedState
}

const getLastError = async (repository, { aggregateIds } = {}) => {
  const viewModel = getViewModel(repository, aggregateIds)
  if (viewModel == null) {
    return null
  }
  await viewModel.initPromise
  return viewModel.lastError
}

const dispose = async ({ viewMap }, { aggregateIds } = {}) => {
  const modelKey = aggregateIds != null ? getKey(aggregateIds) : null

  const disposingViewModels =
    modelKey != null ? [[modelKey, viewMap.get(modelKey)]] : viewMap.entries()

  for (const [key, viewModel] of disposingViewModels) {
    if (viewModel == null) continue
    viewMap.delete(key)

    viewModel.disposed = true
    await viewModel.unsubscribe()
  }
}

const createViewModel = ({
  projection,
  eventStore,
  snapshotAdapter = null,
  invariantHash = null,
  serializeState
}) => {
  if (
    (invariantHash == null || invariantHash.constructor !== String) &&
    snapshotAdapter != null
  ) {
    throw new Error(
      `Field 'invariantHash' is mandatory when using view-model snapshots`
    )
  }

  const repository = {
    projection,
    eventStore,
    viewMap: new Map(),
    snapshotAdapter,
    invariantHash,
    serializeState,
    eventTypes: Object.keys(projection).filter(
      eventName => eventName !== 'Init'
    )
  }

  return Object.freeze({
    read: read.bind(null, repository),
    readAndSerialize: readAndSerialize.bind(null, repository),
    getLastError: getLastError.bind(null, repository),
    dispose: dispose.bind(null, repository)
  })
}

export default createViewModel
