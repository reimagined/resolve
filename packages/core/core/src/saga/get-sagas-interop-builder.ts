import { getLog } from '../get-log'
import {
  Command,
  CommandResult,
  Event,
  SagaEncryptionFactory,
  SagaEventHandlers,
} from '../types/core'
import { SagaMeta } from '../types/runtime'
import {
  SagaInterop,
  SagaInteropMap,
  SagaRuntime,
  SagaRuntimeEventHandler,
  SagasInteropBuilder,
  SchedulerEventTypes,
  SchedulerInfo,
} from './types'
import { createHttpError, HttpStatusCodes } from '../errors'
import { v4 as uuid } from 'uuid'
import { createEventHandler, createInitHandler } from './create-event-handler'
import { buildSchedulerProjection } from './build-scheduler-projection'
import { lateBoundProxy } from '../utils'

const getInterop = (
  saga: {
    name: string
    connectorName: string
    handlers: SagaEventHandlers<any, any>
    encryption?: SagaEncryptionFactory
  },
  runtime: SagaRuntime,
  sideEffects: {
    scheduleCommand: Function
  } & { [key: string]: Function }
): SagaInterop => {
  const { name, connectorName, handlers } = saga

  const acquireResolver = () => {
    throw createHttpError(HttpStatusCodes.NotFound, ``)
  }

  const buildEncryption = async (event: Event) => {
    const { secretsManager } = runtime
    const encryption =
      typeof saga.encryption === 'function'
        ? await saga.encryption(event, { secretsManager })
        : null
    return { ...encryption }
  }

  const monitoredHandler = (
    eventType: string,
    handler: SagaRuntimeEventHandler
  ): SagaRuntimeEventHandler => async () => {
    try {
      return await handler()
    } catch (error) {
      if (runtime.monitoring != null) {
        const monitoringGroup = runtime.monitoring
          .group({
            Part: 'SagaProjection',
          })
          .group({ Saga: saga.name })
          .group({ EventType: eventType })

        monitoringGroup.error(error)
      }
      throw error
    }
  }

  const acquireInitHandler = async (
    store: any
  ): Promise<SagaRuntimeEventHandler | null> => {
    if (typeof handlers.Init === 'function') {
      const handler = createInitHandler(
        name,
        runtime,
        'Init',
        handlers.Init,
        sideEffects
      )

      return monitoredHandler('Init', async () => handler(store))
    }
    return null
  }

  const acquireEventHandler = async (
    store: any,
    event: Event
  ): Promise<SagaRuntimeEventHandler | null> => {
    const log = getLog(`saga:${name}:acquire-event-handler:${event.type}`)
    if (typeof handlers[event.type] === 'function') {
      log.debug(`building handler`)

      try {
        const handler = createEventHandler(
          name,
          runtime,
          event.type,
          handlers[event.type],
          sideEffects,
          await buildEncryption(event)
        )

        return monitoredHandler(event.type, async () => handler(store, event))
      } catch (error) {
        log.error(error)
      }
    }
    log.debug(`handler not found, returning null`)
    return null
  }

  return {
    name,
    connectorName,
    acquireResolver,
    acquireInitHandler,
    acquireEventHandler,
  }
}

const createCommandScheduler = (
  executeCommand: Function,
  schedulerName: string
) => async (date: number, command: Command): Promise<CommandResult> => {
  const log = getLog('create-command-scheduler')
  const aggregateId = uuid()
  log.debug(
    `creating scheduled command aggregate ${schedulerName} with id ${aggregateId}`
  )
  return executeCommand({
    aggregateName: schedulerName,
    aggregateId,
    type: 'create',
    payload: { date, command },
  })
}

export const getSagasInteropBuilder = (
  schedulerName: string,
  schedulerEventTypes: SchedulerEventTypes,
  sagas: SagaMeta[],
  schedulers: SchedulerInfo[]
): SagasInteropBuilder => (runtime) => {
  const appSagas = sagas.map((saga) =>
    getInterop(saga, runtime, {
      ...saga.sideEffects,
      scheduleCommand: createCommandScheduler(
        runtime.executeCommand,
        schedulerName
      ),
    })
  )
  const schedulersSagas = schedulers.map((info) =>
    getInterop(
      {
        ...info,
        handlers: buildSchedulerProjection(schedulerName, schedulerEventTypes),
      },
      runtime,
      lateBoundProxy(
        {
          scheduleCommand: () => {
            /* no-op */
          },
        },
        runtime,
        'scheduler'
      )
    )
  )

  return {
    ...[...appSagas, ...schedulersSagas].reduce<SagaInteropMap>(
      (result, sagaInterop) => {
        result[sagaInterop.name] = sagaInterop
        return result
      },
      {}
    ),
  }
}
