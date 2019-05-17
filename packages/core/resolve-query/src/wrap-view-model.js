const getKey = aggregateIds =>
  Array.isArray(aggregateIds) ? aggregateIds.sort().join(',') : aggregateIds

const buildViewModel = async (
  pool,
  aggregateIds,
  aggregateArgs,
  jwtToken,
  key
) => {
  await Promise.resolve()
  const snapshotKey = `${pool.viewModel.invariantHash};${key}`
  let aggregatesVersionsMap = new Map()
  let lastTimestamp = -1
  let state = null

  try {
    const snapshot = await pool.snapshotAdapter.loadSnapshot(snapshotKey)

    aggregatesVersionsMap = new Map(snapshot.aggregatesVersionsMap)
    lastTimestamp = snapshot.lastTimestamp
    state = await pool.viewModel.deserializeState(snapshot.state)
  } catch (error) {}

  if (
    !(+lastTimestamp > 0) &&
    typeof pool.viewModel.projection.Init === 'function'
  ) {
    state = pool.viewModel.projection.Init()
  }

  const handler = async event => {
    if (!pool.workers.has(key)) {
      throw new Error('View model build has been interrupted')
    }

    state = await pool.viewModel.projection[event.type](
      state,
      event,
      aggregateArgs,
      jwtToken
    )
    lastTimestamp = event.timestamp - 1

    aggregatesVersionsMap.set(event.aggregateId, event.aggregateVersion)

    if (pool.snapshotAdapter != null) {
      await pool.snapshotAdapter.saveSnapshot(snapshotKey, {
        aggregatesVersionsMap: Array.from(aggregatesVersionsMap),
        state: await pool.viewModel.serializeState(state),
        lastTimestamp
      })
    }
  }

  await pool.eventStore.loadEvents(
    {
      aggregateIds: aggregateIds !== '*' ? aggregateIds : null,
      startTime: lastTimestamp,
      eventTypes: Object.keys(pool.viewModel.projection)
    },
    handler
  )

  return state
}

const read = async (pool, modelOptions, aggregateArgs, jwtToken) => {
  if (pool.isDisposed) {
    throw new Error('View model is disposed')
  }
  let aggregateIds = null
  try {
    if (modelOptions !== '*') {
      aggregateIds = modelOptions.split(/,/)
    } else {
      aggregateIds = '*'
    }
  } catch (error) {
    throw new Error(
      `View model ${pool.viewModel.name} requires aggregates identifier list`
    )
  }
  const key = getKey(aggregateIds)

  if (!pool.workers.has(key)) {
    pool.workers.set(
      key,
      buildViewModel(pool, aggregateIds, aggregateArgs, jwtToken, key)
    )
  }

  const result = await pool.workers.get(key)
  pool.workers.delete(key)

  return result
}

const readAndSerialize = async (
  pool,
  modelOptions,
  aggregateArgs,
  jwtToken
) => {
  if (pool.isDisposed) {
    throw new Error('View model is disposed')
  }
  const state = await read(pool, modelOptions, aggregateArgs, jwtToken)

  const result = await pool.viewModel.serializeState(state, jwtToken)

  return result
}

const updateByEvents = async pool => {
  if (pool.isDisposed) {
    throw new Error('View model is disposed')
  }

  throw new Error('View model cannot be updated by events')
}

const drop = async pool => {
  if (pool.isDisposed) {
    throw new Error('View model is disposed')
  }

  throw new Error('Snapshot cleaning for view-models is not implemented')
}

const dispose = async pool => {
  if (pool.isDisposed) {
    throw new Error('View model is disposed')
  }
  pool.isDisposed = true

  pool.workers.clear()
}

const wrapViewModel = (viewModel, snapshotAdapter, eventStore) => {
  const pool = {
    viewModel,
    snapshotAdapter,
    eventStore,
    workers: new Map(),
    isDisposed: false
  }

  return Object.freeze({
    read: read.bind(null, pool),
    readAndSerialize: readAndSerialize.bind(null, pool),
    updateByEvents: updateByEvents.bind(null, pool),
    drop: drop.bind(null, pool),
    dispose: dispose.bind(null, pool)
  })
}

export default wrapViewModel
