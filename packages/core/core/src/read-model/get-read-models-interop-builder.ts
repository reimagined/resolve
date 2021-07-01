import isEmpty from 'lodash.isempty'
import isString from 'lodash.isstring'
import {
  ReadModelsInteropBuilder,
  ReadModelInterop,
  ReadModelRuntime,
  ReadModelInteropMap,
  ReadModelRuntimeEventHandler,
  ReadModelChannelPermit,
  EffectBufferID,
} from './types'
import {
  Event,
  ReadModelNotificationDispatcher,
  ReadModelResolvers,
  Serializable,
} from '../types/core'
import { createHttpError, HttpStatusCodes } from '../errors'
import { getPerformanceTracerSubsegment } from '../utils'
import { ReadModelMeta } from '../types/runtime'
import { getLog } from '../get-log'

type EffectBuffer = {
  notifications: Array<{ channel: string; notification: Serializable }>
}

const noEffectBuffer = -1

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

const getReadModelInterop = (
  readModel: ReadModelMeta,
  runtime: ReadModelRuntime
): ReadModelInterop => {
  const { connectorName, name, resolvers, projection } = readModel
  const { monitoring, secretsManager, dispatchReadModelNotification } = runtime

  const dispatchNotification =
    typeof dispatchReadModelNotification === 'function'
      ? (channel: string, notification: Serializable) =>
          dispatchReadModelNotification(name, channel, notification)
      : undefined

  const resolverInvokerMap = Object.keys(resolvers).reduce<
    ReadModelResolvers<any>
  >((map, resolverName) => {
    map[resolverName] = resolvers[resolverName]
    return map
  }, {})

  let idCounter = 0
  const effectBuffers = new Map<EffectBufferID, EffectBuffer>()

  const buildEncryption = async (event: Event) => {
    const { secretsManager } = runtime
    const encryption =
      typeof readModel.encryption === 'function'
        ? await readModel.encryption(event, { secretsManager })
        : null
    return { ...encryption }
  }

  const buildNotificationDispatcher = async (
    effectBufferId?: EffectBufferID
  ): Promise<{ dispatchNotification: ReadModelNotificationDispatcher }> => {
    const log = getLog(`read-model-interop:${name}:notification-dispatcher`)
    if (effectBufferId != null) {
      const buffer = effectBuffers.get(effectBufferId)
      if (buffer != null) {
        return {
          dispatchNotification: async (
            channel: string,
            notification: Serializable
          ) => {
            buffer.notifications.push({
              channel,
              notification,
            })
          },
        }
      }
    }
    return {
      dispatchNotification: async (channel: string) => {
        log.warn(
          `a try to dispatch a notification to [${channel}] was performed, but no effects buffer allocated`
        )
      },
    }
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

  const beginEffects = async () => {
    if (typeof dispatchNotification === 'function') {
      const effectBufferId = ++idCounter
      effectBuffers.set(effectBufferId, {
        notifications: [],
      })
      return effectBufferId
    }
    return noEffectBuffer
  }

  const commitEffects = async (id: EffectBufferID) => {
    if (id !== noEffectBuffer) {
      const log = getLog(`read-model-interop:${name}:commit-effects`)

      const effects = effectBuffers.get(id)

      if (effects != null) {
        if (typeof dispatchNotification === 'function') {
          log.debug(`dispatching ${effects.notifications.length} notifications`)
          try {
            await Promise.all(
              effects.notifications.map(({ channel, notification }) =>
                dispatchNotification(channel, notification)
              )
            )
          } catch (error) {
            log.error(error)
          }
        } else {
          effects.notifications.forEach(({ channel, notification }) => {
            log.verbose(`[${channel}]: ${notification}`)
          })
        }
      }

      effectBuffers.delete(id)
    }
  }

  const dropEffects = async (id: EffectBufferID) => {
    if (id !== noEffectBuffer) {
      effectBuffers.delete(id)
    }
  }

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

    let channelPermit: ReadModelChannelPermit

    const permitChannel = (channel: string, permit: string) => {
      if (channelPermit != null) {
        throw monitoredError(
          runtime,
          createHttpError(
            HttpStatusCodes.InternalServerError,
            `Resolver "${resolver}" already permit other channel`
          ),
          name,
          resolver
        )
      }

      if (!isString(channel) || isEmpty(channel)) {
        throw monitoredError(
          runtime,
          createHttpError(
            HttpStatusCodes.InternalServerError,
            `Bad channel name`
          ),
          name,
          resolver
        )
      }

      if (!isString(permit) || isEmpty(permit)) {
        throw monitoredError(
          runtime,
          createHttpError(
            HttpStatusCodes.InternalServerError,
            `Bad channel permit value`
          ),
          name,
          resolver
        )
      }

      channelPermit = {
        channel,
        permit,
        name,
      }
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
        const data = await invoker(connection, args, {
          secretsManager,
          permitChannel,
          jwt: context.jwt,
        })
        log.verbose(data)
        return {
          data,
          meta: {
            channelPermit,
          },
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

  const acquireInitHandler = async (
    store: any,
    effectBufferId?: EffectBufferID
  ): Promise<ReadModelRuntimeEventHandler | null> => {
    if (projection.Init != null && typeof projection.Init === 'function') {
      return monitoredHandler('Init', async () => projection.Init?.(store))
    }
    return null
  }

  const acquireEventHandler = async (
    store: any,
    event: Event,
    effectBufferId?: EffectBufferID
  ): Promise<ReadModelRuntimeEventHandler | null> => {
    if (typeof projection[event.type] === 'function') {
      return monitoredHandler(event.type, async () =>
        projection[event.type](store, event, {
          ...(await buildEncryption(event)),
          ...(await buildNotificationDispatcher(effectBufferId)),
        })
      )
    }
    return null
  }

  const acquireChannel = async () => readModel.channel ?? null

  return {
    name,
    connectorName,
    acquireResolver,
    acquireEventHandler,
    acquireInitHandler,
    acquireChannel,
    beginEffects,
    commitEffects,
    dropEffects,
  }
}

export const getReadModelsInteropBuilder = (
  readModels: ReadModelMeta[]
): ReadModelsInteropBuilder => (runtime) =>
  readModels.reduce<ReadModelInteropMap>((map, model) => {
    map[model.name] = getReadModelInterop(model, runtime)
    return map
  }, {})
