const createViewModel = ({
  projection,
  eventStore,
  snapshotAdapter = null,
  snapshotBucketSize = 100,
  invariantHash = null,
  serializeState
}) => {
  const getKey = aggregateIds =>
    Array.isArray(aggregateIds) ? aggregateIds.sort().join(',') : aggregateIds
  const viewMap = new Map()

  if (
    (invariantHash == null || invariantHash.constructor !== String) &&
    snapshotAdapter != null
  ) {
    throw new Error(
      `Field 'invariantHash' is mandatory when using view-model snapshots`
    )
  }

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

    const snapshotKey = `${invariantHash};${key}`
    const eventTypes = Object.keys(projection).filter(
      eventName => eventName !== 'Init'
    )

    let aggregateIdsSet = new Set()
    let appliedEvents = 0
    let lastTimestamp = 0
    let lastError = null
    let state = null

    try {
      const snapshot = await snapshotAdapter.loadSnapshot(snapshotKey)
      if (Array.isArray(snapshot.aggregateIdsSet)) {
        aggregateIdsSet = new Set(snapshot.aggregateIdsSet)
      }
      lastTimestamp = snapshot.timestamp
      state = snapshot.state
    } catch (error) {}

    try {
      if (!(+lastTimestamp > 0) && typeof projection.Init === 'function') {
        state = projection.Init()
      }
    } catch (error) {
      lastError = error
    }

    const callback = event => {
      if (!event || !event.type || lastError) return
      try {
        state = projection[event.type](state, event)
        aggregateIdsSet.add(event.aggregateId)

        if (
          snapshotAdapter != null &&
          ++appliedEvents % snapshotBucketSize === 0
        ) {
          lastTimestamp = Date.now()
          snapshotAdapter.saveSnapshot(snapshotKey, {
            state,
            lastTimestamp,
            aggregateIdsSet: Array.from(aggregateIdsSet)
          })
        }
      } catch (error) {
        lastError = error
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
      if (lastError) throw lastError

      const aggregateVersionsMap = {}

      if (aggregateIds !== '*') {
        for (const aggregateId of aggregateIds) {
          aggregateVersionsMap[aggregateId] = 0
        }
      }

      await eventStore.getEventsByAggregateId(
        Array.from(aggregateIdsSet),
        event => {
          aggregateVersionsMap[event.aggregateId] = event.aggregateVersion
        }
      )

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
    readAndSerialize: async ({ jwtToken, ...args }) => {
      const { state, aggregateVersionsMap } = await reader(args)
      const serializedState = serializeState(state, jwtToken)
      return { serializedState, aggregateVersionsMap }
    },
    dispose
  })
}

export default createViewModel
