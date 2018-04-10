import createDefaultAdapter from 'resolve-readmodel-memory'
import { diff } from 'diff-json'

const emptyFunction = () => {}

const [diffWrapperPrev, diffWrapperNext] = [{ wrap: null }, { wrap: null }]

const init = (adapter, eventStore, projection, eventListener) => {
  if (projection === null) {
    return {
      ...adapter.init(),
      onDispose: emptyFunction
    }
  }

  const { getLastAppliedTimestamp = () => 0, ...readApi } = adapter.init()
  let unsubscriber = null

  let onDispose = () => {
    if (unsubscriber === null) {
      onDispose = emptyFunction
      return
    }
    unsubscriber()
  }

  const loadDonePromise = new Promise((resolve, reject) => {
    let flowPromise = Promise.resolve()

    const forceStop = (reason, chainable = true) => {
      if (flowPromise) {
        flowPromise.catch(reject)
        flowPromise = null
        onDispose()
      }

      loadDonePromise.lateFailure = reason
      if (chainable) {
        return Promise.reject(reason)
      }

      reject(reason)
    }

    const projectionInvoker = async event => await projection[event.type](event)

    const synchronizedEventWorker = event =>
      (flowPromise = flowPromise
        ? flowPromise
            .then(projectionInvoker.bind(null, event))
            .then(eventListener.bind(null, event))
            .catch(forceStop)
        : flowPromise)

    Promise.resolve()
      .then(getLastAppliedTimestamp)
      .then(startTime =>
        eventStore.subscribeByEventType(
          Object.keys(projection),
          synchronizedEventWorker,
          {
            startTime
          }
        )
      )
      .then(unsub => {
        if (flowPromise) {
          flowPromise = flowPromise.then(resolve).catch(forceStop)
        }

        if (onDispose !== emptyFunction) {
          unsubscriber = unsub
        } else {
          unsub()
        }
      })
      .catch(err => forceStop(err, false))
  })

  return {
    ...readApi,
    loadDonePromise,
    onDispose
  }
}

const read = async (repository, adapter, eventStore, projection, ...args) => {
  if (!repository.loadDonePromise) {
    Object.assign(
      repository,
      init(adapter, eventStore, projection, repository.eventListener)
    )
  }

  const { getError, getReadable, loadDonePromise } = repository
  await loadDonePromise

  if (loadDonePromise && loadDonePromise.hasOwnProperty('lateFailure')) {
    throw loadDonePromise.lateFailure
  }

  const readableError = await getError()
  if (readableError) {
    throw readableError
  }

  return await getReadable(...args)
}

const createReadModel = ({ projection, eventStore, adapter, resolvers }) => {
  const currentAdapter = adapter || createDefaultAdapter()
  const builtProjection = projection
    ? currentAdapter.buildProjection(projection)
    : null
  const externalEventListeners = []
  const repository = {
    eventListener: event =>
      externalEventListeners.forEach(callback =>
        Promise.resolve().then(callback.bind(null, event))
      )
  }

  const getReadModel = read.bind(
    null,
    repository,
    currentAdapter,
    eventStore,
    builtProjection
  )

  const reader = async (resolverName, resolverArgs) => {
    if (!resolvers || typeof resolvers[resolverName] !== 'function') {
      throw new Error(
        `The '${resolverName}' resolver is not specified or not function`
      )
    }
    const store = await getReadModel()
    return await resolvers[resolverName](store, resolverArgs)
  }

  const dispose = () => {
    if (!repository.loadDonePromise) {
      return
    }
    repository.onDispose()
    Object.keys(repository).forEach(key => {
      delete repository[key]
    })
    externalEventListeners.length = 0

    currentAdapter.reset()
  }

  const addEventListener = callback => {
    if (typeof callback !== 'function') return
    externalEventListeners.push(callback)
  }

  const removeEventListener = callback => {
    if (typeof callback !== 'function') return
    const idx = externalEventListeners.findIndex(cb => callback === cb)
    if (idx < 0) return
    externalEventListeners.splice(idx, 1)
  }

  const makeReactiveReader = async (
    publisher,
    resolverName,
    resolverArgs = {}
  ) => {
    if (typeof publisher !== 'function') {
      throw new Error(
        'Publisher should be callback function (diff: Object) => void'
      )
    }

    let result = await reader(resolverName, resolverArgs)
    let flowPromise = Promise.resolve()

    const eventHandler = async () => {
      if (!flowPromise) return

      const actualResult = await reader(resolverName, resolverArgs)
      void ([diffWrapperPrev.wrap, diffWrapperNext.wrap] = [
        result,
        actualResult
      ])

      const difference = diff(diffWrapperPrev, diffWrapperNext)
      result = actualResult

      await publisher(difference)
    }

    const eventListener = event =>
      (flowPromise = flowPromise.then(eventHandler.bind(null, event)))
    addEventListener(eventListener)

    const forceStop = () => {
      if (!flowPromise) return
      removeEventListener(eventListener)
      flowPromise = null
    }

    return { result, forceStop }
  }

  return Object.freeze({
    read: reader,
    dispose,
    makeReactiveReader,
    getReadModel
  })
}

export default createReadModel
