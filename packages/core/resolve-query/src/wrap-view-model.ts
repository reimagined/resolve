import getLog from './get-log'
import { WrapViewModelOptions } from './types'
import parseReadOptions from './parse-read-options'

type AggregateIds = string | string[]

type ViewModelMeta = {
  name: string
  invariantHash: string
  deserializeState: Function
  serializeState: Function
  projection: { [key: string]: Function }
  resolver: Function
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

const read = async (
  pool: ViewModelPool,
  { jwt, ...params }: any
): Promise<any> => {
  const viewModelName = pool.viewModel.name
  const [modelOptions, aggregateArgs] = parseReadOptions(params)

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

  const getLocalLog = (scope: string): any =>
    getLog(`buildViewModel:${viewModelName}${scope}`)
  const log = getLocalLog('')

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
    log.verbose(error.message)
  }

  if (cursor == null && typeof pool.viewModel.projection.Init === 'function') {
    log.debug(`initializing view model from scratch`)
    state = pool.viewModel.projection.Init()
  }

  log.debug(`retrieving event store secrets manager`)
  const secretsManager =
    typeof pool.getSecretsManager === 'function'
      ? await pool.getSecretsManager()
      : null

  const handler = async (event: any): Promise<any> => {
    const handlerLog = getLocalLog(`:handler:${event.type}`)
    handlerLog.debug(`executing`)

    try {
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
      log.error(error.message)
      throw error
    }
  }

  const eventTypes = Object.keys(pool.viewModel.projection).filter(
    type => type !== 'Init'
  )

  const { events } = await pool.eventstoreAdapter.loadEvents({
    aggregateIds: aggregateIds !== '*' ? aggregateIds : null,
    eventTypes,
    cursor,
    limit: Number.MAX_SAFE_INTEGER
  })

  log.debug(`fetched ${events.length} events for the view model, applying`)

  for (const event of events) {
    await handler(event)
  }

  return state
  return {
    data: state,
    eventCount,
    cursor
  }
}

const read = async (
  pool: ViewModelPool,
  modelOptions: any,
  aggregateArgs: any,
  jwt: string
): Promise<any> => {
  const viewModelName = pool.viewModel.name

  if (pool.isDisposed) {
    throw new Error(`View model "${viewModelName}" is disposed`)
  }

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

    const eventTypes = Object.keys(pool.viewModel.projection).filter(
      type => type !== 'Init'
    )

    const resolverViewModelBuilder = async (
      name: string,
      { aggregateIds }: any
    ): Promise<any> => {
      const buildSubSegment = segment
        ? segment.addNewSubsegment('buildViewModel')
        : null

      try {
        if (buildSubSegment != null) {
          buildSubSegment.addAnnotation('viewModelName', viewModelName)
          buildSubSegment.addAnnotation('origin', 'resolve:query:read')
        }

        if (name !== viewModelName) {
          throw new Error(`The '${name}' view model is inaccessible`)
        }

        if (pool.isDisposed) {
          throw new Error(`View model "${viewModelName}" is disposed`)
        }

        const key = getKey(aggregateIds)

        if (!pool.workers.has(key)) {
          pool.workers.set(
            key,
            buildViewModel(pool, aggregateIds, aggregateArgs, jwt, key)
          )
        }

        const { data, eventCount, cursor } = await pool.workers.get(key)

        if (buildSubSegment != null) {
          buildSubSegment.addAnnotation('eventCount', eventCount)
          buildSubSegment.addAnnotation('origin', 'resolve:query:read')
        }

        pool.workers.delete(key)

        return { data, cursor }
      } catch (error) {
        if (buildSubSegment != null) {
          buildSubSegment.addError(error)
        }

        throw error
      } finally {
        if (buildSubSegment != null) {
          buildSubSegment.close()
        }
      }
    }

    return await pool.viewModel.resolver(
      {
        buildViewModel: resolverViewModelBuilder
      },
      { aggregateIds },
      {
        jwt,
        viewModel: {
          ...pool.viewModel,
          eventTypes
        }
      }
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

const serializeState = async (
  pool: ViewModelPool,
  state: any,
  jwt: string
): Promise<any> => {
  return pool.viewModel.serializeState(state, jwt)
}

const sendEvents = async (pool: ViewModelPool): Promise<any> => {
  const viewModelName = pool.viewModel.name

  if (pool.isDisposed) {
    throw new Error(`View model "${viewModelName}" is disposed`)
  }

  throw new Error(`View model "${viewModelName}" cannot be updated by events`)
}

const drop = async (pool: ViewModelPool): Promise<any> => {
  const viewModelName = pool.viewModel.name

  if (pool.isDisposed) {
    throw new Error(`View model "${viewModelName}" is disposed`)
  }

  throw new Error(
    `Snapshot cleaning for view-model "${viewModelName}" is not implemented`
  )
}

const dispose = async (pool: ViewModelPool): Promise<any> => {
  const viewModelName = pool.viewModel.name

  if (pool.isDisposed) {
    throw new Error(`View model "${viewModelName}" is disposed`)
  }
  pool.isDisposed = true
}

const wrapViewModel = ({
  viewModel,
  eventstoreAdapter,
  performanceTracer
}: WrapViewModelOptions) => {
  const getSecretsManager = eventstoreAdapter.getSecretsManager.bind(null)
  const pool = {
    viewModel,
    eventstoreAdapter,
    isDisposed: false,
    performanceTracer,
    getSecretsManager
  }

  return Object.freeze({
    read: read.bind(null, pool),
    readAndSerialize: readAndSerialize.bind(null, pool),
    sendEvents: sendEvents.bind(null, pool),
    serializeState: serializeState.bind(null, pool),
    updateByEvents: updateByEvents.bind(null, pool),
    drop: drop.bind(null, pool),
    dispose: dispose.bind(null, pool)
  })
}

export default wrapViewModel
