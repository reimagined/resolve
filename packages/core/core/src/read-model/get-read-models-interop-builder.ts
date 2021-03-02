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
import getLog from '../get-log'

const monitoredError = async (
  runtime: ReadModelRuntime,
  error: Error,
  meta: any
) => {
  await runtime.monitoring?.error?.(error, 'readModelResolver', meta)
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
      throw await monitoredError(
        runtime,
        createHttpError(
          HttpStatusCodes.UnprocessableEntity,
          `Resolver "${resolver}" does not exist`
        ),
        {
          readModelName: name,
          resolverName: resolver,
        }
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
        await monitoring?.error?.(error, 'readModelResolver', {
          readModelName: name,
          resolverName: resolver,
        })
        throw error
      } finally {
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
      await monitoring?.error?.(error, 'readModelProjection', {
        readModelName: readModel.name,
      })
      throw error
    }
  }

  const acquireInitHandler = async (
    store: any
  ): Promise<ReadModelRuntimeEventHandler | null> => {
    if (typeof projection.Init === 'function') {
      return monitoredHandler('Init', async () => projection.Init(store))
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
