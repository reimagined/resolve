import invariantFunctionHash from 'invariant-function-hash'
const GeneratorProto = (function*() {})().__proto__.__proto__
const PromiseProto = (async function() {})().__proto__

const filterAsyncResult = result => {
  if (
    result &&
    result.__proto__ &&
    result.__proto__.__proto__ === GeneratorProto
  ) {
    throw new Error(
      'A Projection function cannot be a generator or return an iterable object'
    )
  }
  if (result && result.__proto__ === PromiseProto) {
    throw new Error(
      'A Projection function cannot be asynchronous or return a Promise object'
    )
  }
}

const emptySnapshotAdapter = Object.freeze({
  loadSnapshot: async () => ({ timestamp: 0, state: null }),
  saveSnapshot: () => null
})

const makeViewModelHash = projection =>
  Object.keys(projection)
    .sort()
    .map(
      handlerName =>
        `${handlerName}:${invariantFunctionHash(projection[handlerName])}`
    )
    .join(',')

const createViewModel = ({
  projection,
  eventStore,
  snapshotAdapter = emptySnapshotAdapter,
  snapshotBucketSize = 100
}) => {
  const getKey = aggregateIds =>
    Array.isArray(aggregateIds) ? aggregateIds.sort().join(',') : aggregateIds
  const viewMap = new Map()
  const viewModelHash = makeViewModelHash(projection)

  const reader = async ({ aggregateIds } = { aggregateIds: null }) => {
    if (
      aggregateIds !== '*' &&
      (!Array.isArray(aggregateIds) || aggregateIds.length === 0)
    ) {
      throw new Error(
        'View models are build up only with aggregateIds array or wildcard argument'
      )
    }

    const key = getKey(aggregateIds)
    if (viewMap.has(key)) {
      const executor = viewMap.get(key)
      return await executor()
    }

    const snapshotKey = `${viewModelHash};${key}`
    const eventTypes = Object.keys(projection).filter(
      eventName => eventName !== 'Init'
    )

    let aggregateVersionsMap = {}
    let appliedEvents = 0
    let lastTimestamp = 0
    let state = null
    let error = null

    try {
      const snapshot = await snapshotAdapter.loadSnapshot(snapshotKey)
      aggregateVersionsMap = snapshot.aggregateVersionsMap
      lastTimestamp = snapshot.timestamp
      state = snapshot.state
    } catch (err) {}

    if (typeof aggregateVersionsMap !== 'object') {
      aggregateVersionsMap = {}
    }

    try {
      if (!(+lastTimestamp > 0) && typeof projection.Init === 'function') {
        state = projection.Init()
        filterAsyncResult(state)
      }
    } catch (err) {
      error = err
    }

    const callback = event => {
      if (!event || !event.type || error) return
      try {
        state = projection[event.type](state, event)
        filterAsyncResult(state)

        if (!aggregateVersionsMap.hasOwnProperty(event.aggregateId)) {
          aggregateVersionsMap[event.aggregateId] = 0
        }

        aggregateVersionsMap[event.aggregateId] = event.aggregateVersion

        if (++appliedEvents % snapshotBucketSize === 0) {
          lastTimestamp = Date.now()
          snapshotAdapter.saveSnapshot(snapshotKey, {
            state,
            lastTimestamp,
            aggregateVersionsMap
          })
        }
      } catch (err) {
        error = err
      }
    }

    const subscribePromise =
      aggregateIds === '*'
        ? eventStore.subscribeByEventType(eventTypes, callback, {
            onlyBus: false,
            startTime: lastTimestamp
          })
        : eventStore.subscribeByAggregateId(
            aggregateIds,
            event => eventTypes.includes(event.type) && callback(event),
            { onlyBus: false, startTime: lastTimestamp }
          )

    const executor = async () => {
      await subscribePromise
      if (error) throw error
      return {
        state,
        aggregateVersionsMap
      }
    }

    executor.dispose = () => subscribePromise.then(unsubscribe => unsubscribe())

    viewMap.set(key, executor)
    return await executor()
  }

  const dispose = aggregateIds => {
    if (!aggregateIds) {
      viewMap.forEach(executor => executor.dispose())
      viewMap.clear()
      return
    }

    const key = getKey(aggregateIds)
    if (!viewMap.has(key)) {
      return
    }

    viewMap.get(key).dispose()
    viewMap.delete(key)
  }

  return Object.freeze({
    read: reader,
    dispose
  })
}

export default createViewModel
