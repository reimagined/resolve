const wrapViewModel = (viewModel, snapshotAdapter, eventStore) => {
  const getKey = aggregateIds =>
    Array.isArray(aggregateIds) ? aggregateIds.sort().join(',') : aggregateIds
  const workers = new Map()

  const read = async (modelOptions, aggregateArgs, jwtToken) => {
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
            typeof viewmodel.projection.Init === 'function'
          ) {
            state = viewmodel.projection.Init()
          }

          const handler = async event => {
            if (!workers.has(key)) {
              throw new Error('View model build has been interrupted')
            }

            state = await viewModel.projection[event.type](
              state,
              event,
              aggregateArgs
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
              aggregateIds: viewModel.aggregateIds,
              startTime: lastTimestamp,
              eventTypes: Object.kets(viewModel.projection)
            },
            handler
          )
        })()
      )
    }

    const result = await workers.get(key)
    workers.delete(key)

    return result
  }

  const readAndSerialize = async (modelOptions, aggregateArgs, jwtToken) => {
    const state = await read(modelOptions, aggregateArgs, jwtToken)
    const result = await viewModel.serializeState(state, jwtToken)
    return result
  }

  const updateByEvents = async () => {
    throw new Error('View model cannot be updated by events')
  }

  const drop = async () => {
    throw new Error('Snapshot cleaning for view-models is not implemented')
  }

  const dispose = async () => {
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
