import {
  ReadModelsInteropBuilder,
  ReadModelInterop,
  ReadModelRuntime,
  ReadModelInteropMap,
  ReadModelRuntimeEventHandler,
} from './types'
import { Event } from '../types/core'
import { createHttpError, HttpStatusCodes } from '../errors'
import { getPerformanceTracerSubsegment } from '../utils'
import {
  MiddlewareContext,
  ReadModelMeta,
  ResolverMiddlewareHandler,
} from '../types/runtime'
import { getLog } from '../get-log'
import { makeMiddlewareApplier } from '../helpers'

const monitoredError = (
  runtime: ReadModelRuntime,
  error: Error,
  readModelName: string,
  resolverName: string
) => {
  if (runtime.monitoring != null) {
    const monitoringGroup = runtime.monitoring
      .group({ Part: 'ReadModelResolver' })
      .group({ ReadModel: readModelName })
      .group({ Resolver: resolverName })

    monitoringGroup.error(error)
  }
  return error
}

const makeReadModelInteropCreator = (runtime: ReadModelRuntime) => {
  const {
    monitoring,
    secretsManager,
    resolverMiddlewares = [],
    projectionMiddlewares = [],
  } = runtime

  const applyProjectionMiddlewares = makeMiddlewareApplier(
    projectionMiddlewares
  )
  const applyResolverMiddlewares = makeMiddlewareApplier(resolverMiddlewares)

  return (readModel: ReadModelMeta): ReadModelInterop => {
    const { connectorName, name, resolvers, projection } = readModel

    const resolverInvokerMap = Object.keys(resolvers).reduce<{
      [key: string]: ResolverMiddlewareHandler
    }>((map, resolverName) => {
      map[
        resolverName
      ] = applyResolverMiddlewares(
        (middlewareContext, connection, args, context) =>
          resolvers[resolverName](connection, args, context)
      )
      return map
    }, {})

    const projectionHandlersChain = applyProjectionMiddlewares(
      (middlewareContext, store, event, context) =>
        projection[event.type](store, event, context)
    )

    const acquireResolver = async (
      resolver: string,
      args: any,
      context: { jwt?: string },
      middlewareContext: MiddlewareContext = {}
    ) => {
      const log = getLog(
        `read-model-interop:${name}:acquireResolver:${resolver}`
      )

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
                .group({ Part: 'ReadModelResolver' })
                .group({ ReadModel: name })
                .group({ Resolver: resolver })
            : null

        if (monitoringGroup != null) {
          monitoringGroup.time('Execution')
        }

        try {
          log.debug(`invoking the resolver`)

          const data = await invoker(
            {
              ...middlewareContext,
              readModelName: name,
              resolverName: resolver,
            },
            connection,
            args,
            {
              secretsManager,
              jwt: context.jwt,
            }
          )
          // const data = await invoker(connection, args, {
          //   secretsManager,
          //   jwt: context.jwt,
          // })
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
            .group({ Part: 'ReadModelProjection' })
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
          projectionHandlersChain(
            { readModelName: name },
            store,
            event,
            await buildEncryption(event)
          )
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
}

export const getReadModelsInteropBuilder = (
  readModels: ReadModelMeta[]
): ReadModelsInteropBuilder => (runtime) => {
  const getReadModelInterop = makeReadModelInteropCreator(runtime)
  return readModels.reduce<ReadModelInteropMap>((map, model) => {
    map[model.name] = getReadModelInterop(model)
    return map
  }, {})
}
