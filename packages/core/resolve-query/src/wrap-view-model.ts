import getLog from './get-log'
import {
  WrapViewModelOptions,
  ViewModelPool,
  BuildViewModelQuery,
} from './types'
import parseReadOptions from './parse-read-options'
import { IS_BUILT_IN } from 'resolve-core'

type AggregateIds = string | string[]

const getKey = (aggregateIds: AggregateIds): string =>
  Array.isArray(aggregateIds) ? aggregateIds.sort().join(',') : aggregateIds

const buildViewModel = async (
  pool: ViewModelPool,
  { aggregateIds, aggregateArgs }: BuildViewModelQuery,
  jwt: any,
  key: any
): Promise<any> => {
  const viewModelName = pool.viewModel.name

  if (pool.isDisposed) {
    throw new Error(`View model "${viewModelName}" is disposed`)
  }

  const log = getLog(`buildViewModel:${viewModelName}`)

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

  let eventCount = 0

  log.debug(`retrieving event store secrets manager`)
  const secretsManager =
    typeof pool.getSecretsManager === 'function'
      ? await pool.getSecretsManager()
      : null

  const handler = async (event: any): Promise<any> => {
    const handlerLog = getLog(
      `buildViewModel:${viewModelName}:handler:${event.type}`
    )
    handlerLog.debug(`executing`)
    const segment = pool.performanceTracer
      ? pool.performanceTracer.getSegment()
      : null
    const subSegment = segment ? segment.addNewSubsegment('applyEvent') : null

    try {
      eventCount++

      if (subSegment != null) {
        subSegment.addAnnotation('viewModelName', viewModelName)
        subSegment.addAnnotation('eventType', event.type)
        subSegment.addAnnotation('origin', 'resolve:query:applyEvent')
      }

      handlerLog.debug(`building view-model encryption`)
      const encryption = await pool.viewModel.encryption(event, {
        secretsManager,
      })

      handlerLog.debug(`applying event to projection`)
      state = await pool.viewModel.projection[event.type](
        state,
        event,
        aggregateArgs,
        {
          jwt,
          ...encryption,
        }
      )
      cursor = await pool.eventstoreAdapter.getNextCursor(cursor, [event])

      aggregatesVersionsMap.set(event.aggregateId, event.aggregateVersion)

      handlerLog.debug(`saving the snapshot`)
      await pool.eventstoreAdapter.saveSnapshot(
        snapshotKey,
        JSON.stringify({
          aggregatesVersionsMap: Array.from(aggregatesVersionsMap),
          state: await pool.viewModel.serializeState(state, jwt),
          cursor,
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

  const eventTypes = Object.keys(pool.viewModel.projection).filter(
    (type) => type !== 'Init'
  )

  const { events } = await pool.eventstoreAdapter.loadEvents({
    aggregateIds,
    eventTypes,
    cursor,
    limit: Number.MAX_SAFE_INTEGER,
  })

  log.debug(`fetched ${events.length} events for the view model, applying`)

  for (const event of events) {
    await handler(event)
  }

  return {
    data: state,
    eventCount,
    cursor,
  }
}

const read = async (
  pool: ViewModelPool,
  { jwt, ...params }: any
): Promise<any> => {
  const viewModelName = pool.viewModel.name

  const [originalAggregateIds, aggregateArgs] = parseReadOptions(params)
  let aggregateIds = null
  try {
    if (Array.isArray(originalAggregateIds)) {
      aggregateIds = [...originalAggregateIds]
    } else if (originalAggregateIds === '*') {
      aggregateIds = null
    } else {
      aggregateIds = originalAggregateIds.split(/,/)
    }
  } catch (error) {
    throw new Error(`The following arguments are required: aggregateIds`)
  }

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

    const eventTypes = Object.keys(pool.viewModel.projection).filter(
      (type) => type !== 'Init'
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

        const { data, eventCount, cursor } = await buildViewModel(
          pool,
          { aggregateIds, aggregateArgs },
          jwt,
          key
        )

        if (buildSubSegment != null) {
          buildSubSegment.addAnnotation('eventCount', eventCount)
          buildSubSegment.addAnnotation('origin', 'resolve:query:read')
        }

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
        buildViewModel: resolverViewModelBuilder,
      },
      { aggregateIds },
      {
        jwt,
        viewModel: {
          ...pool.viewModel,
          eventTypes,
        },
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
  { state, jwt }: any
): Promise<any> => {
  const serializer = pool.viewModel.serializeState
  if (serializer[IS_BUILT_IN]) {
    return JSON.stringify(state, null, 2)
  }
  return JSON.stringify(
    {
      ...state,
      data: serializer(state.data, jwt),
    },
    null,
    2
  )
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
  performanceTracer,
}: WrapViewModelOptions) => {
  const getSecretsManager = eventstoreAdapter.getSecretsManager.bind(null)
  const pool: ViewModelPool = {
    viewModel,
    eventstoreAdapter,
    isDisposed: false,
    performanceTracer,
    getSecretsManager,
  }

  return Object.freeze({
    read: read.bind(null, pool),
    sendEvents: sendEvents.bind(null, pool),
    serializeState: serializeState.bind(null, pool),
    drop: drop.bind(null, pool),
    dispose: dispose.bind(null, pool),
  })
}

export default wrapViewModel
