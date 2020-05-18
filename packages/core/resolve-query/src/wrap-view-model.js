import { getNextCursor } from 'resolve-eventstore-base'
import debugLevels from 'resolve-debug-levels'

const log = debugLevels('resolve:resolve-query:wrap-view-model')

const getKey = aggregateIds =>
  Array.isArray(aggregateIds) ? aggregateIds.sort().join(',') : aggregateIds

const buildViewModel = async (
  pool,
  aggregateIds,
  aggregateArgs,
  jwtToken,
  key
) => {
  const viewModelName = pool.viewModel.name

  await Promise.resolve()
  const snapshotKey = `${pool.viewModel.invariantHash};${key}`
  let aggregatesVersionsMap = new Map()
  let cursor = null
  let state = null

  try {
    const snapshot = JSON.parse(
      await pool.snapshotAdapter.loadSnapshot(snapshotKey)
    )
    aggregatesVersionsMap = new Map(snapshot.aggregatesVersionsMap)
    state = await pool.viewModel.deserializeState(snapshot.state)
    cursor = snapshot.cursor
  } catch (error) {}

  if (cursor == null && typeof pool.viewModel.projection.Init === 'function') {
    state = pool.viewModel.projection.Init()
  }

  let eventCount = 0

  const handler = async event => {
    const segment = pool.performanceTracer
      ? pool.performanceTracer.getSegment()
      : null
    const subSegment = segment ? segment.addNewSubsegment('applyEvent') : null

    try {
      if (!pool.workers.has(key)) {
        throw new Error(
          `View model "${viewModelName}" building has been interrupted`
        )
      }

      eventCount++

      if (subSegment != null) {
        subSegment.addAnnotation('viewModelName', viewModelName)
        subSegment.addAnnotation('eventType', event.type)
        subSegment.addAnnotation('origin', 'resolve:query:applyEvent')
      }

      log.debug(`retrieving event store secrets manager`)
      const secretsManager = await pool.eventStore.getSecretsManager()

      log.debug(`building view-model encryption`)
      const encryption = await pool.viewModel.encryption(event, {
        secretsManager
      })

      state = await pool.viewModel.projection[event.type](
        state,
        event,
        aggregateArgs,
        {
          jwt: jwtToken,
          ...encryption
        }
      )
      cursor = await pool.getNextCursor(cursor, [event])

      aggregatesVersionsMap.set(event.aggregateId, event.aggregateVersion)

      if (pool.snapshotAdapter != null) {
        await pool.snapshotAdapter.saveSnapshot(
          snapshotKey,
          JSON.stringify({
            aggregatesVersionsMap: Array.from(aggregatesVersionsMap),
            state: await pool.viewModel.serializeState(state),
            cursor
          })
        )
      }
    } catch (error) {
      if (subSegment != null) {
        subSegment.addError(error)
      }
      throw error
    } finally {
      if (subSegment != null) {
        subSegment.close()
      }
    }
  }

  const { events } = await pool.publisher.read({
    aggregateIds: aggregateIds !== '*' ? aggregateIds : null,
    eventTypes: Object.keys(pool.viewModel.projection),
    cursor,
    limit: Number.MAX_SAFE_INTEGER
  })

  for (const event of events) {
    await handler(event)
  }

  return { state, eventCount }
}

const read = async (pool, modelOptions, aggregateArgs, jwtToken) => {
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment('read') : null

  try {
    const viewModelName = pool.viewModel.name

    if (subSegment != null) {
      subSegment.addAnnotation('viewModelName', viewModelName)
      subSegment.addAnnotation('origin', 'resolve:query:read')
    }

    if (pool.isDisposed) {
      throw new Error(`View model "${viewModelName}" is disposed`)
    }
    let aggregateIds = null
    try {
      if (Array.isArray(modelOptions)) {
        aggregateIds = [...modelOptions]
      } else if (modelOptions === '*') {
        aggregateIds = '*'
      } else {
        aggregateIds = modelOptions.split(/,/)
      }
    } catch (error) {
      throw new Error(
        `View model "${viewModelName}" requires aggregates identifier list`
      )
    }
    const key = getKey(aggregateIds)

    if (!pool.workers.has(key)) {
      pool.workers.set(
        key,
        buildViewModel(pool, aggregateIds, aggregateArgs, jwtToken, key)
      )
    }

    const { state, eventCount } = await pool.workers.get(key)

    if (subSegment != null) {
      subSegment.addAnnotation('eventCount', eventCount)
      subSegment.addAnnotation('origin', 'resolve:query:read')
    }

    pool.workers.delete(key)

    return state
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }
    throw error
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const readAndSerialize = async (
  pool,
  modelOptions,
  aggregateArgs,
  jwtToken
) => {
  const viewModelName = pool.viewModel.name

  if (pool.isDisposed) {
    throw new Error(`View model "${viewModelName}" is disposed`)
  }
  const state = await read(pool, modelOptions, aggregateArgs, jwtToken)

  const result = await pool.viewModel.serializeState(state, jwtToken)

  return result
}

const updateByEvents = async pool => {
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment('updateByEvents') : null

  try {
    const viewModelName = pool.viewModel.name

    if (subSegment != null) {
      subSegment.addAnnotation('viewModelName', viewModelName)
      subSegment.addAnnotation('origin', 'resolve:query:updateByEvents')
    }

    if (pool.isDisposed) {
      throw new Error(`View model "${viewModelName}" is disposed`)
    }

    throw new Error(`View model "${viewModelName}" cannot be updated by events`)
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }
    throw error
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const drop = async pool => {
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment('drop') : null

  try {
    const viewModelName = pool.viewModel.name

    if (subSegment != null) {
      subSegment.addAnnotation('viewModelName', viewModelName)
      subSegment.addAnnotation('origin', 'resolve:query:drop')
    }

    if (pool.isDisposed) {
      throw new Error(`View model "${viewModelName}" is disposed`)
    }

    throw new Error(
      `Snapshot cleaning for view-model "${viewModelName}" is not implemented`
    )
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }
    throw error
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const dispose = async pool => {
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment('dispose') : null

  try {
    const viewModelName = pool.viewModel.name

    if (subSegment != null) {
      subSegment.addAnnotation('viewModelName', viewModelName)
    }

    if (pool.isDisposed) {
      throw new Error(`View model "${viewModelName}" is disposed`)
    }
    pool.isDisposed = true

    pool.workers.clear()
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }
    throw error
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const wrapViewModel = (
  viewModel,
  snapshotAdapter,
  publisher,
  performanceTracer
) => {
  const pool = {
    viewModel,
    snapshotAdapter,
    publisher,
    workers: new Map(),
    isDisposed: false,
    performanceTracer,
    getNextCursor
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
