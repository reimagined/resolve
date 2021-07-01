import {
  ReadModelsInteropBuilder,
  ReadModelInterop,
  ReadModelRuntime,
  ReadModelInteropMap,
  ReadModelRuntimeEventHandler,
} from './types'
import { Event, ReadModelResolvers } from '../types/core'
import { createHttpError, HttpStatusCodes } from '../errors'
import { getPerformanceTracerSubsegment } from '../utils'
import { ReadModelMeta } from '../types/runtime'
import { getLog } from '../get-log'

const monitoredError = (
  runtime: ReadModelRuntime,
  error: Error,
  readModelName: string,
  resolverName: string
) => {
  if (runtime.monitoring != null) {
    const monitoringGroup = runtime.monitoring
      .group({ Part: 'ReadModel' })
      .group({ ReadModel: readModelName })
      .group({ Resolver: resolverName })

    monitoringGroup.error(error)
  }
  return error
}

const getReadModelInterop = (
  readModel: ReadModelMeta,
  runtime: ReadModelRuntime
): ReadModelInterop => {
  const { connectorName, name, resolvers, projection } = readModel
  const { monitoring, secretsManager } = runtime

  const resolverInvokerMap = Object.keys(resolvers).reduce<
    ReadModelResolvers<any>
  >((map, resolverName) => {
    map[resolverName] = resolvers[resolverName]
    return map
  }, {})

  const acquireResolver = async (
    resolver: string,
    args: any,
    context: { jwt?: string }
  ) => {
    const log = getLog(`read-model-interop:${name}:acquireResolver:${resolver}`)
    const invoker = resolverInvokerMap[resolver]
    if (invoker == null) {
      log.error(`unable to find invoker for the resolver`)
      throw monitoredError(
        runtime,
        createHttpError(
          HttpStatusCodes.UnprocessableEntity,
          `Resolver "${resolver}" does not exist`
        ),
        name,
        resolver
      )
    }

    log.debug(`invoker found`)

    return async (connection: any) => {
      const subSegment = getPerformanceTracerSubsegment(
        monitoring,
        'resolver',
        {
          readModelName: name,
          resolverName: resolver,
          origin: 'resolve:query:resolver',
        }
      )

      const monitoringGroup =
        monitoring != null
          ? monitoring
              .group({ Part: 'ReadModel' })
              .group({ ReadModel: name })
              .group({ Resolver: resolver })
          : null

      if (monitoringGroup != null) {
        monitoringGroup.time('Execution')
      }

      try {
        log.debug(`invoking the resolver`)
        const data = await invoker(connection, args, {
          secretsManager,
          jwt: context.jwt,
        })
        log.verbose(data)
        return {
          data,
        }
      } catch (error) {
        log.error(error)
        if (subSegment != null) {
          subSegment.addError(error)
        }

        if (monitoringGroup != null) {
          monitoringGroup.error(error)
        }
        throw error
      } finally {
        if (monitoringGroup != null) {
          monitoringGroup.timeEnd('Execution')
        }

        if (subSegment != null) {
          subSegment.close()
        }
      }
    }
  }

  const buildEncryption = async (event: Event) => {
    const { secretsManager } = runtime
    const encryption =
      typeof readModel.encryption === 'function'
        ? await readModel.encryption(event, { secretsManager })
        : null
    return { ...encryption }
  }

  const monitoredHandler = (
    eventType: string,
    handler: ReadModelRuntimeEventHandler
  ): ReadModelRuntimeEventHandler => async () => {
    try {
      return await handler()
    } catch (error) {
      if (monitoring != null) {
        const monitoringGroup = monitoring
          .group({ Part: 'ReadModel' })
          .group({ ReadModel: readModel.name })
          .group({ EventType: eventType })

        monitoringGroup.error(error)
      }
      throw error
    }
  }

  const acquireInitHandler = async (
    store: any
  ): Promise<ReadModelRuntimeEventHandler | null> => {
    if (projection.Init != null && typeof projection.Init === 'function') {
      return monitoredHandler('Init', async () => projection.Init?.(store))
    }
    return null
  }

  const acquireEventHandler = async (
    store: any,
    event: Event
  ): Promise<ReadModelRuntimeEventHandler | null> => {
    if (typeof projection[event.type] === 'function') {
      return monitoredHandler(event.type, async () =>
        projection[event.type](store, event, await buildEncryption(event))
      )
    }
    return null
  }

  return {
    name,
    connectorName,
    acquireResolver,
    acquireEventHandler,
    acquireInitHandler,
  }
}

export const getReadModelsInteropBuilder = (
  readModels: ReadModelMeta[]
): ReadModelsInteropBuilder => (runtime) =>
  readModels.reduce<ReadModelInteropMap>((map, model) => {
    map[model.name] = getReadModelInterop(model, runtime)
    return map
  }, {})
