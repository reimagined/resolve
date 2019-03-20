const wrapViewModel = (viewModel, snapshotAdapter, eventStore) => {
  const getKey = aggregateIds =>
    Array.isArray(aggregateIds) ? aggregateIds.sort().join(',') : aggregateIds
  const workers = new Map()
  let isDisposed = false

  const read = async (modelOptions, aggregateArgs, jwtToken) => {
    if (isDisposed) {
      throw new Error('View model is disposed')
    }
    const aggregateIds = modelOptions !== '*' ? modelOptions.split(/,/) : '*'
    if (
      aggregateIds !== '*' &&
      (!Array.isArray(aggregateIds) || aggregateIds.length === 0)
    ) {
      throw new Error(
        `View model ${viewModel.name} requires aggregates identifier list`
      )
    }
    const key = getKey(aggregateIds)

    if (!workers.has(key)) {
      workers.set(
        key,
        (async () => {
          const snapshotKey = `${viewModel.invariantHash};${key}`
          let aggregatesVersionsMap = new Map()
          let lastTimestamp = -1
          let state = null

          try {
            const snapshot = await snapshotAdapter.loadSnapshot(snapshotKey)
            aggregatesVersionsMap = new Map(snapshot.aggregatesVersionsMap)
            lastTimestamp = snapshot.lastTimestamp
            state = viewModel.deserializeState(snapshot.state)
          } catch (error) {}

          if (
            !(+lastTimestamp > 0) &&
            typeof viewModel.projection.Init === 'function'
          ) {
            state = viewModel.projection.Init()
          }

          const handler = async event => {
            if (!workers.has(key)) {
              throw new Error('View model build has been interrupted')
            }

            state = await viewModel.projection[event.type](
              state,
              event,
              aggregateArgs,
              jwtToken
            )
            lastTimestamp = event.timestamp - 1

            aggregatesVersionsMap.set(event.aggregateId, event.aggregateVersion)

            if (snapshotAdapter != null) {
              await snapshotAdapter.saveSnapshot(snapshotKey, {
                aggregatesVersionsMap: Array.from(aggregatesVersionsMap),
                state: await viewModel.serializeState(state),
                lastTimestamp
              })
            }
          }

          await eventStore.loadEvents(
            {
              aggregateIds: aggregateIds !== '*' ? aggregateIds : null,
              startTime: lastTimestamp,
              eventTypes: Object.keys(viewModel.projection)
            },
            handler
          )

          return state
        })()
      )
    }

    const result = await workers.get(key)
    workers.delete(key)

    return result
  }

  const readAndSerialize = async (modelOptions, aggregateArgs, jwtToken) => {
    if (isDisposed) {
      throw new Error('View model is disposed')
    }
    const state = await read(modelOptions, aggregateArgs, jwtToken)

    const result = await viewModel.serializeState(state, jwtToken)

    return result
  }

  const updateByEvents = async () => {
    if (isDisposed) {
      throw new Error('View model is disposed')
    }

    throw new Error('View model cannot be updated by events')
  }

  const drop = async () => {
    if (isDisposed) {
      throw new Error('View model is disposed')
    }

    throw new Error('Snapshot cleaning for view-models is not implemented')
  }

  const dispose = async () => {
    if (isDisposed) {
      throw new Error('View model is disposed')
    }
    isDisposed = true

    workers.clear()
  }

  const api = {
    read,
    readAndSerialize,
    updateByEvents,
    drop,
    dispose
  }

  const executeQuery = (...args) => read(...args)
  Object.assign(executeQuery, api)

  return executeQuery
}

export default wrapViewModel
