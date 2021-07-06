import { ViewModelMeta } from '../types/runtime'
import {
  ViewModelBuildContext,
  ViewModelBuildParams,
  ViewModelBuildResult,
  ViewModelInterop,
  ViewModelInteropMap,
  ViewModelRuntime,
  ViewModelRuntimeResolver,
  ViewModelsInteropBuilder,
} from './types'
import { getLog } from '../get-log'
import {
  getPerformanceTracerSegment,
  getPerformanceTracerSubsegment,
} from '../utils'
import { IS_BUILT_IN } from '../symbols'

const getKey = (aggregateIds: string[]): string => aggregateIds.sort().join(',')

const buildViewModel = async (
  viewModel: ViewModelMeta,
  runtime: ViewModelRuntime,
  params: ViewModelBuildParams,
  context: ViewModelBuildContext
): Promise<ViewModelBuildResult> => {
  const {
    name,
    invariantHash,
    deserializeState,
    serializeState,
    projection,
  } = viewModel
  const { aggregateIds: rawIds, aggregateArgs } = params
  const { eventstore, secretsManager, monitoring } = runtime
  const { jwt } = context

  const aggregateIds = Array<string>().concat(rawIds)

  const log = getLog(`build-view-model:${name}`)

  const snapshotKey = `VM;${invariantHash};${getKey(aggregateIds)}`
  log.verbose(`snapshotKey: ${snapshotKey}`)

  let aggregatesVersionsMap = new Map()
  let cursor: any = null
  let state: any = null

  try {
    log.debug(`loading latest snapshot`)
    const snapshotData = await eventstore.loadSnapshot(snapshotKey)
    if (snapshotData != null) {
      log.verbose(`snapshot: ${snapshotData}`)
      const snapshot = JSON.parse(snapshotData)

      if (snapshot != null) {
        aggregatesVersionsMap = new Map(snapshot.aggregatesVersionsMap)
        log.debug(`deserialize snapshot state`)
        state = await deserializeState(snapshot.state)
        log.verbose(`snapshot state: ${state}`)
        cursor = snapshot.cursor
        log.verbose(`snapshot cursor: ${cursor}`)
      }
    }
  } catch (error) {
    log.verbose(error.message)
  }

  if (cursor == null && typeof projection.Init === 'function') {
    log.debug(`initializing view model from scratch`)
    state = projection.Init()
  }

  let eventCount = 0

  const handler = async (event: any): Promise<any> => {
    const handlerLog = getLog(`build-view-model:${name}:handler:${event.type}`)
    handlerLog.debug(`executing`)
    const subSegment = getPerformanceTracerSubsegment(monitoring, 'applyEvent')

    try {
      eventCount++

      subSegment.addAnnotation('viewModelName', name)
      subSegment.addAnnotation('eventType', event.type)
      subSegment.addAnnotation('origin', 'resolve:query:applyEvent')

      handlerLog.debug(`building view-model encryption`)
      const encryption = await viewModel.encryption(event, {
        secretsManager,
      })

      handlerLog.debug(`applying event to projection`)
      state = await projection[event.type](state, event, aggregateArgs, {
        jwt,
        ...encryption,
      })
      cursor = await eventstore.getNextCursor(cursor, [event])

      aggregatesVersionsMap.set(event.aggregateId, event.aggregateVersion)

      handlerLog.debug(`saving the snapshot`)
      await eventstore.saveSnapshot(
        snapshotKey,
        JSON.stringify({
          aggregatesVersionsMap: Array.from(aggregatesVersionsMap),
          state: await serializeState(state, jwt),
          cursor,
        })
      )
    } catch (error) {
      subSegment.addError(error)
      log.error(error.message)

      if (monitoring != null) {
        const monitoringGroup = monitoring
          .group({ Part: 'ViewModelProjection' })
          .group({ ViewModel: name })
          .group({ EventType: event.type })

        monitoringGroup.error(error)
      }
      throw error
    } finally {
      subSegment.close()
    }
  }

  const eventTypes = Object.keys(projection).filter((type) => type !== 'Init')

  const { events } = await eventstore.loadEvents({
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

const getViewModelInterop = (
  viewModel: ViewModelMeta,
  runtime: ViewModelRuntime
): ViewModelInterop => {
  const { name } = viewModel

  const acquireResolver = async (
    params: ViewModelBuildParams,
    context: ViewModelBuildContext
  ): Promise<ViewModelRuntimeResolver> => async (): Promise<ViewModelBuildResult> => {
    const { name, projection, resolver } = viewModel
    const { monitoring } = runtime

    const monitoringGroup =
      monitoring != null
        ? monitoring
            .group({ Part: 'ViewModelResolver' })
            .group({ ViewModel: name })
        : null

    const segment = getPerformanceTracerSegment(monitoring)
    const subSegment = segment.addNewSubsegment('read')
    let executionError

    monitoringGroup?.time('Execution')

    try {
      subSegment.addAnnotation('viewModelName', name)
      subSegment.addAnnotation('origin', 'resolve:query:read')

      const eventTypes = Object.keys(projection).filter(
        (type) => type !== 'Init'
      )

      const resolverViewModelBuilder = async (
        targetName: string,
        { aggregateIds, aggregateArgs }: ViewModelBuildParams
      ): Promise<ViewModelBuildResult> => {
        const buildSubSegment = segment.addNewSubsegment('buildViewModel')
        buildSubSegment.addAnnotation('viewModelName', name)
        buildSubSegment.addAnnotation('origin', 'resolve:query:read')

        try {
          if (targetName !== name) {
            throw new Error(`The '${name}' view model is inaccessible`)
          }

          const { data, eventCount, cursor } = await buildViewModel(
            viewModel,
            runtime,
            {
              aggregateIds,
              aggregateArgs,
            },
            context
          )

          buildSubSegment.addAnnotation('eventCount', eventCount)
          buildSubSegment.addAnnotation('origin', 'resolve:query:read')

          return { data, cursor, eventCount }
        } catch (error) {
          buildSubSegment.addError(error)
          throw error
        } finally {
          buildSubSegment.close()
        }
      }

      return await resolver(
        {
          buildViewModel: resolverViewModelBuilder,
        },
        params,
        {
          jwt: context.jwt,
          viewModel: {
            name,
            eventTypes,
          },
        }
      )
    } catch (error) {
      executionError = error
      subSegment.addError(error)
      throw error
    } finally {
      if (monitoringGroup != null) {
        monitoringGroup.timeEnd('Execution')

        if (executionError != null) {
          monitoringGroup.execution(executionError)
        } else {
          monitoringGroup.execution()
        }
      }

      subSegment.close()
    }
  }

  const serialize = (result: { data: any }, jwt?: string): string => {
    const serializer = viewModel.serializeState
    if (serializer[IS_BUILT_IN]) {
      return JSON.stringify(result, null, 2)
    }
    return JSON.stringify(
      {
        ...result,
        data: serializer(result.data, jwt),
      },
      null,
      2
    )
  }

  return {
    name,
    serialize,
    acquireResolver,
  }
}

export const getViewModelsInteropBuilder = (
  viewModels: ViewModelMeta[]
): ViewModelsInteropBuilder => (runtime) =>
  viewModels.reduce<ViewModelInteropMap>((map, model) => {
    map[model.name] = getViewModelInterop(model, runtime)
    return map
  }, {})
