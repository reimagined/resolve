const projectionInvoker = async (repository, event) => {
  if (
    repository.disposePromise &&
    typeof repository.cancelSubscription !== 'function'
  ) {
    throw new Error('Read model is disposed')
  } else if (
    repository.disposePromise ||
    repository.hasOwnProperty('lastError')
  ) {
    return
  }

  try {
    if (event == null || event.constructor !== Object) {
      return
    }
    const expectedAggregateVersion = repository.aggregatesVersionsMap.get(
      event.aggregateId
    )
    if (
      expectedAggregateVersion != null &&
      event.aggregateVersion <= expectedAggregateVersion
    ) {
      return
    }

    await repository.projection[event.type](event)
  } catch (error) {
    repository.lastError = error

    if (typeof repository.cancelSubscription === 'function') {
      await repository.cancelSubscription()
    } else {
      throw error
    }
  }
}

const init = async repository => {
  const { adapter, eventStore, projection } = repository
  if (projection == null) {
    Object.assign(repository, adapter.init())
    return
  }

  const { prepareProjection, ...readApi } = adapter.init()
  const { aggregatesVersionsMap, lastTimestamp } = await prepareProjection()

  Object.assign(repository, {
    prepareProjection,
    aggregatesVersionsMap,
    lastTimestamp,
    ...readApi
  })

  repository.subscribePromise = eventStore.subscribeByEventType(
    Object.keys(projection),
    projectionInvoker.bind(null, repository),
    { startTime: lastTimestamp }
  )

  repository.cancelSubscription = await repository.subscribePromise
}

const getReadInterface = async repository => {
  if (repository.disposePromise) {
    throw new Error('Read model is disposed')
  }

  if (!repository.hasOwnProperty('loadDonePromise')) {
    repository.loadDonePromise = init(repository)
  }

  try {
    await repository.loadDonePromise
  } catch (err) {}

  try {
    return await repository.getReadInterface()
  } catch (err) {
    return null
  }
}

const getLastError = async repository => {
  if (repository.disposePromise) {
    throw new Error('Read model is disposed')
  }

  if (!repository.hasOwnProperty('loadDonePromise')) {
    return null
  }

  try {
    await repository.loadDonePromise
  } catch (error) {
    return error
  }

  if (repository.hasOwnProperty('lastError')) {
    return repository.lastError
  }

  return null
}

const read = async (repository, { resolverName, resolverArgs, jwtToken }) => {
  if (repository.disposePromise) {
    throw new Error('Read model is disposed')
  }

  const resolver = repository.resolvers[resolverName]

  if (typeof resolver !== 'function') {
    throw new Error(
      `The '${resolverName}' resolver is not specified or not function`
    )
  }

  const store = await getReadInterface(repository)

  return await resolver(store, resolverArgs, jwtToken)
}

const readAndSerialize = async (
  repository,
  { resolverName, resolverArgs, jwtToken }
) => {
  const result = await read(repository, {
    resolverName,
    resolverArgs,
    jwtToken
  })

  return JSON.stringify(result, null, 2)
}

const dispose = (repository, options = {}) => {
  if (options == null || options.constructor !== Object) {
    throw new Error(
      'Dispose options should be object or not be passed to use default behaviour'
    )
  }

  if (repository.disposePromise) {
    return repository.disposePromise
  }

  if (!repository.hasOwnProperty('loadDonePromise')) {
    return
  }

  const disposePromise = (async (cancelSubscription, reset) => {
    if (typeof cancelSubscription === 'function') {
      await cancelSubscription()
    }

    await reset(options)
  })(repository.cancelSubscription, repository.adapter.reset)

  Object.keys(repository).forEach(key => {
    delete repository[key]
  })

  repository.disposePromise = disposePromise
  return repository.disposePromise
}

const resolverNames = repository => {
  if (repository.disposePromise) {
    throw new Error('Read model is disposed')
  }

  return Object.keys(repository.resolvers)
}

const createReadModel = ({ adapter, projection, eventStore, resolvers }) => {
  const repository = {
    projection: projection != null ? adapter.buildProjection(projection) : null,
    resolvers: resolvers != null ? resolvers : {},
    adapter,
    eventStore
  }

  return Object.freeze({
    getReadInterface: getReadInterface.bind(null, repository),
    getLastError: getLastError.bind(null, repository),
    read: read.bind(null, repository),
    readAndSerialize: readAndSerialize.bind(null, repository),
    resolverNames: resolverNames.bind(null, repository),
    dispose: dispose.bind(null, repository)
  })
}

export default createReadModel
