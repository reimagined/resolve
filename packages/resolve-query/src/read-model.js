import 'regenerator-runtime/runtime'
import createDefaultAdapter from 'resolve-readmodel-memory'

const emptyFunction = () => {}

const init = (adapter, eventStore, projection) => {
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

      if (chainable) {
        return Promise.reject(reason)
      }

      reject(reason)
    }

    const synchronizedEventWorker = event => {
      if (
        !flowPromise ||
        !event ||
        !event.type ||
        typeof projection[event.type] !== 'function'
      ) {
        return
      }

      flowPromise = flowPromise
        .then(projection[event.type].bind(null, event))
        .catch(forceStop)
    }

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
    Object.assign(repository, init(adapter, eventStore, projection))
  }

  const { getError, getReadable, loadDonePromise } = repository
  await loadDonePromise

  const readableError = await getError()
  if (readableError) {
    throw readableError
  }

  return await getReadable(...args)
}

const createReadModel = ({ projection, eventStore, adapter }) => {
  const currentAdapter = adapter || createDefaultAdapter()
  const builtProjection = projection
    ? currentAdapter.buildProjection(projection)
    : null
  const repository = {}
  const getReadModel = read.bind(
    null,
    repository,
    currentAdapter,
    eventStore,
    builtProjection
  )

  const reader = async (...args) => await getReadModel(...args)

  reader.dispose = () => {
    if (!repository.loadDonePromise) {
      return
    }
    repository.onDispose()
    Object.keys(repository).forEach(key => {
      delete repository[key]
    })

    currentAdapter.reset()
  }

  return reader
}

export default createReadModel
