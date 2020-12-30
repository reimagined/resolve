import {
  ReadModelsInteropBuilder,
  ReadModelMeta,
  ReadModelInterop,
  ReadModelResolver,
  ReadModelRuntime,
  ReadModelResolverMap,
  ReadModelInteropMap,
} from './types'
import { createHttpError, HttpStatusCodes } from 'resolve-core'
import { getPerformanceTracerSubsegment } from '../utils'

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
  const { monitoring, getSecretsManager } = runtime

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
    const invoker = resolverInvokerMap[resolver]
    if (invoker == null) {
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
        return {
          data: await invoker(connection, args, {
            secretsManager: await getSecretsManager(),
            jwt: context.jwt,
          }),
        }
      } catch (error) {
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
