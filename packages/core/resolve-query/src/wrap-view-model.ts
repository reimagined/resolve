import getLog from './get-log'

type AggregateIds = string | string[]

type ViewModelMeta = {
  name: string
  invariantHash: string
  deserializeState: Function
  serializeState: Function
  projection: { [key: string]: Function }
  encryption: Function
}

type ViewModelPool = {
  viewModel: ViewModelMeta
  eventstoreAdapter: any
  getSecretsManager: Function
  performanceTracer: any
  workers: Map<string, any>
  isDisposed: boolean
}

const getKey = (aggregateIds: AggregateIds): string =>
  Array.isArray(aggregateIds) ? aggregateIds.sort().join(',') : aggregateIds

const buildViewModel = async (
  pool: ViewModelPool,
  aggregateIds: AggregateIds,
  aggregateArgs: any,
  jwt: string,
  key: string
): Promise<any> => {
  const viewModelName = pool.viewModel.name
  const getLocalLog = (scope: string): any =>
    getLog(`buildViewModel:${viewModelName}${scope}`)
  const log = getLocalLog('')

  await Promise.resolve()
  const snapshotKey = `VM;${pool.viewModel.invariantHash};${key}`
  log.verbose(`snapshotKey: ${snapshotKey}`)

  let aggregatesVersionsMap = new Map()
  let cursor: any = null
  let state: any = null

  try {
    log.debug(`loading latest snapshot`)
    const snapshotData = await pool.eventstoreAdapter.loadSnapshot(snapshotKey)
    log.verbose(`snapshot: ${snapshotData}`)
    const snapshot = JSON.parse(snapshotData)

    if (snapshot != null) {
      aggregatesVersionsMap = new Map(snapshot.aggregatesVersionsMap)
      log.debug(`deserialize snapshot state`)
      state = await pool.viewModel.deserializeState(snapshot.state)
      log.verbose(`snapshot state: ${state}`)
      cursor = snapshot.cursor
      log.verbose(`snapshot cursor: ${cursor}`)
    }
  } catch (error) {
    log.warn(error.message)
  }

  if (cursor == null && typeof pool.viewModel.projection.Init === 'function') {
    log.debug(`initializing view model from scratch`)
    state = pool.viewModel.projection.Init()
  }

  let eventCount = 0

  log.debug(`retrieving event store secrets manager`)
  const secretsManager =
    typeof pool.getSecretsManager === 'function'
      ? await pool.getSecretsManager()
      : null

  const handler = async (event: any): Promise<any> => {
    const handlerLog = getLocalLog(`:handler:${event.type}`)
    handlerLog.debug(`executing`)
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

      handlerLog.debug(`building view-model encryption`)
      const encryption = await pool.viewModel.encryption(event, {
        secretsManager
      })

      handlerLog.debug(`applying event to projection`)
      state = await pool.viewModel.projection[event.type](
        state,
        event,
        aggregateArgs,
        {
          jwt,
          ...encryption
        }
      )
      cursor = await pool.eventstoreAdapter.getNextCursor(cursor, [event])

      aggregatesVersionsMap.set(event.aggregateId, event.aggregateVersion)

      handlerLog.debug(`saving the snapshot`)
      await pool.eventstoreAdapter.saveSnapshot(
        snapshotKey,
        JSON.stringify({
          aggregatesVersionsMap: Array.from(aggregatesVersionsMap),
          state: await pool.viewModel.serializeState(state),
          cursor
        })
      )
    } catch (error) {
      if (subSegment != null) {
        subSegment.addError(error)
      }
      log.error(error.message)
      throw error
    } finally {
      if (subSegment != null) {
        subSegment.close()
      }
    }
  }

  const { events } = await pool.eventstoreAdapter.loadEvents({
    aggregateIds: aggregateIds !== '*' ? aggregateIds : null,
    eventTypes: Object.keys(pool.viewModel.projection),
    cursor,
    limit: Number.MAX_SAFE_INTEGER
  })

  log.debug(`fetched ${events.length} events for the view model, applying`)

  for (const event of events) {
    await handler(event)
  }

  return { state, eventCount }
}

const read = async (
  pool: ViewModelPool,
  modelOptions: any,
  aggregateArgs: any,
  jwt: string
): Promise<any> => {
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
        buildViewModel(pool, aggregateIds, aggregateArgs, jwt, key)
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
  pool: ViewModelPool,
  modelOptions: any,
  aggregateArgs: any,
  jwt: string
): Promise<any> => {
  const viewModelName = pool.viewModel.name

  if (pool.isDisposed) {
    throw new Error(`View model "${viewModelName}" is disposed`)
  }
  const state = await read(pool, modelOptions, aggregateArgs, jwt)

  return pool.viewModel.serializeState(state, jwt)
}

const updateByEvents = async (pool: ViewModelPool): Promise<any> => {
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

const drop = async (pool: ViewModelPool): Promise<any> => {
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

const dispose = async (pool: ViewModelPool): Promise<any> => {
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
  viewModel: ViewModelMeta,
  eventstoreAdapter: any,
  performanceTracer: any,
  getSecretsManager: any
) => {
  const pool = {
    viewModel,
    eventstoreAdapter,
    workers: new Map(),
    isDisposed: false,
    performanceTracer,
    getSecretsManager
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
