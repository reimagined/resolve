import {
  ReadModelsInteropBuilder,
  ReadModelInterop,
  ReadModelResolver,
  ReadModelRuntime,
  ReadModelResolverMap,
  ReadModelInteropMap,
} from './types'
import { SecretsManager } from '../core-types'
import { createHttpError, HttpStatusCodes } from '../errors'
import { getPerformanceTracerSubsegment } from '../utils'
import { ReadModelMeta } from '../types'
import getLog from '../get-log'

const makeResolverInvoker = (resolver: ReadModelResolver) => resolver

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
  const { connectorName, name, resolvers } = readModel
  const { monitoring } = runtime

  const resolverInvokerMap = Object.keys(resolvers).reduce<
    ReadModelResolverMap
  >((map, resolverName) => {
    map[resolverName] = makeResolverInvoker(resolvers[resolverName])
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

    return async (connection: any, secretsManager: SecretsManager | null) => {
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

  return {
    name,
    connectorName,
    acquireResolver,
  }
}

export const getReadModelsInteropBuilder = (
  readModels: ReadModelMeta[]
): ReadModelsInteropBuilder => (runtime) =>
  readModels.reduce<ReadModelInteropMap>((map, model) => {
    map[model.name] = getReadModelInterop(model, runtime)
    return map
  }, {})
