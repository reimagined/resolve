const emptyFunction = () => {}

const init = async repository => {
  const { adapter, eventStore, projection } = repository
  if (projection == null) {
    Object.assign(repository, adapter.init(), {
      loadDonePromise: Promise.resolve(),
      onDispose: emptyFunction
    })
    return
  }

  const { prepareProjection, ...readApi } = adapter.init()
  let subscriptionCanceler = null

  let onDispose = () => {
    if (subscriptionCanceler === null) {
      onDispose = emptyFunction
      return
    }
    subscriptionCanceler()
  }

  const loadDonePromise = new Promise((resolve, reject) => {
    let flowPromise = Promise.resolve()

    const forceStop = (reason, chainable = true) => {
      if (flowPromise != null) {
        flowPromise.catch(reject)
        flowPromise = null
        onDispose()
      }

      repository.lateFailure = reason
      if (chainable) {
        return Promise.reject(reason)
      }

      reject(reason)
    }

    const projectionInvoker = async (event, aggregatesVersionsMap) => {
      if (event == null || event.constructor !== Object) {
        return
      }
      const expectedAggregateVersion = aggregatesVersionsMap.get(
        event.aggregateId
      )
      if (
        expectedAggregateVersion != null &&
        event.aggregateVersion <= expectedAggregateVersion
      ) {
        return
      }

      await projection[event.type](event)
    }

    const synchronizedEventWorker = (aggregatesVersionsMap, event) => {
      if (flowPromise == null) return

      flowPromise = flowPromise
        .then(projectionInvoker.bind(null, event, aggregatesVersionsMap))
        .catch(forceStop)
    }

    Promise.resolve()
      .then(prepareProjection)
      .then(({ lastTimestamp, aggregatesVersionsMap }) =>
        eventStore.subscribeByEventType(
          Object.keys(projection),
          synchronizedEventWorker.bind(null, aggregatesVersionsMap),
          {
            startTime: lastTimestamp
          }
        )
      )
      .then(cancelSubscription => {
        if (flowPromise) {
          flowPromise = flowPromise.then(resolve).catch(forceStop)
        }
        if (onDispose !== emptyFunction) {
          subscriptionCanceler = cancelSubscription
        } else {
          cancelSubscription()
        }
      })
      .catch(error => forceStop(error, false))
  })

  Object.assign(repository, readApi, {
    loadDonePromise,
    onDispose
  })
}

const getReadInterface = async repository => {
  if (!repository.hasOwnProperty('loadDonePromise')) {
    init(repository)
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
  if (!repository.hasOwnProperty('loadDonePromise')) {
    return null
  }

  try {
    await repository.loadDonePromise
  } catch (error) {
    return error
  }

  if (repository.hasOwnProperty('lateFailure')) {
    return repository.lateFailure
  }

  return null
}

const read = async (repository, { resolverName, resolverArgs, jwtToken }) => {
  const resolver = repository.resolvers[resolverName]

  if (typeof resolver !== 'function') {
    throw new Error(
      `The '${resolverName}' resolver is not specified or not function`
    )
  }

  const store = await getReadInterface(repository)
  return await resolver(store, resolverArgs, jwtToken)
}

const dispose = (repository, drop = false) => {
  if (repository.disposePromise) {
    return repository.disposePromise
  }

  const disposePromise = Promise.resolve([
    repository.onDispose,
    repository.adapter.reset
  ]).then(async ([onDispose, reset]) => {
    await onDispose()
    await reset(drop)
  })

  Object.keys(repository).forEach(key => {
    delete repository[key]
  })

  repository.disposePromise = disposePromise
  return repository.disposePromise
}

const createReadModel = ({ adapter, projection, eventStore, resolvers }) => {
  const repository = {
    projection: projection != null ? adapter.buildProjection(projection) : null,
    resolvers: resolvers != null ? resolvers : {},
    onDispose: () => null,
    adapter,
    eventStore
  }

  return Object.freeze({
    getReadInterface: getReadInterface.bind(null, repository),
    getLastError: getLastError.bind(null, repository),
    read: read.bind(null, repository),
    readAndSerialize: async (...args) =>
      JSON.stringify(await read(repository, ...args)),
    resolverNames: Object.keys(resolvers != null ? resolvers : {}),
    dispose: dispose.bind(null, repository)
  })
}

export default createReadModel
