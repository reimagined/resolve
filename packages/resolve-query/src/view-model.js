import 'regenerator-runtime/runtime'

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

const createViewModel = ({ projection, eventStore }) => {
  const getKey = aggregateIds =>
    Array.isArray(aggregateIds) ? aggregateIds.sort().join(',') : aggregateIds
  const viewMap = new Map()

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

    let state = null
    let error = null

    try {
      if (typeof projection.Init === 'function') {
        state = projection.Init()
        filterAsyncResult(state)
      }
    } catch (err) {
      error = err
    }

    const callback = event => {
      if (!event || !event.type || error) {
        return
      }
      try {
        state = projection[event.type](state, event)
        filterAsyncResult(state)
      } catch (err) {
        error = err
      }
    }

    const eventTypes = Object.keys(projection).filter(
      eventName => eventName !== 'Init'
    )

    const subscribePromise =
      aggregateIds === '*'
        ? eventStore.subscribeByEventType(eventTypes, callback)
        : eventStore.subscribeByAggregateId(
            aggregateIds,
            event => eventTypes.includes(event.type) && callback(event)
          )

    const executor = async () => {
      await subscribePromise
      if (error) throw error
      return state
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
