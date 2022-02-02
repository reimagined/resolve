import { createQueryExecutor } from '../query/index'
import type {
  InvokeBuildAsync,
  CallMethodParams,
  Runtime,
  RuntimeFactoryParameters,
  SagaExecutor,
  Scheduler,
} from '../types'
import type { SecretsManager } from '@resolve-js/core'

type CreateSagaOptions = {
  applicationName: string
  invokeBuildAsync: InvokeBuildAsync
  getEventSubscriberDestination: (name: string) => string
  readModelConnectors: Runtime['readModelConnectors']
  executeCommand: Runtime['executeCommand']
  executeQuery: Runtime['executeQuery']
  performanceTracer: RuntimeFactoryParameters['performanceTracer']
  uploader: Runtime['uploader']
  eventstoreAdapter: Runtime['eventStoreAdapter']
  secretsManager: SecretsManager
  getVacantTimeInMillis: () => number
  getScheduler: () => Scheduler
  monitoring: Runtime['monitoring']
  domainInterop: RuntimeFactoryParameters['domainInterop']
  executeSchedulerCommand: Runtime['executeSchedulerCommand']
}

export const createSagaExecutor = ({
  invokeBuildAsync,
  applicationName,
  readModelConnectors,
  executeCommand,
  executeQuery,
  performanceTracer,
  uploader,
  eventstoreAdapter,
  getEventSubscriberDestination,
  secretsManager,
  getVacantTimeInMillis,
  getScheduler,
  monitoring,
  domainInterop,
  executeSchedulerCommand,
}: CreateSagaOptions) => {
  const { sagaDomain } = domainInterop

  const executeCommandOrScheduler = async (...args: any[]) => {
    if (
      !(
        args.length > 0 &&
        args.length < 3 &&
        Object(args[0]) === args[0] &&
        (Object(args[1]) === args[1] || args[1] == null)
      )
    ) {
      throw new Error(
        `Invalid saga command/scheduler args ${JSON.stringify(args)}`
      )
    }
    const options = { ...args[0] }

    const aggregateName = options.aggregateName
    if (aggregateName === sagaDomain.schedulerName) {
      return await executeSchedulerCommand(options)
    } else {
      return await executeCommand(options)
    }
  }

  const executeDirectQuery = async (...args: any[]) => {
    if (
      !(
        args.length > 0 &&
        args.length < 3 &&
        Object(args[0]) === args[0] &&
        (Object(args[1]) === args[1] || args[1] == null)
      )
    ) {
      throw new Error(`Invalid saga query args ${JSON.stringify(args)}`)
    }

    const options = { ...args[0] }

    return await executeQuery(options)
  }

  let currentSagaName: string | null = null
  const runtime = Object.create(Object.prototype, {
    executeCommand: { get: () => executeCommandOrScheduler, enumerable: true },
    executeQuery: { get: () => executeDirectQuery, enumerable: true },
    secretsManager: { get: () => secretsManager, enumerable: true },
    uploader: { get: () => uploader, enumerable: true },
    scheduler: { get: getScheduler, enumerable: true },
  })

  const executeSagaListener = createQueryExecutor({
    invokeBuildAsync,
    applicationName,
    readModelConnectors,
    performanceTracer,
    getVacantTimeInMillis,
    eventstoreAdapter,
    getEventSubscriberDestination,
    monitoring,
    loadReadModelProcedure: () => Promise.resolve(null),
    readModelsInterop: domainInterop.sagaDomain.acquireSagasInterop(runtime),
    viewModelsInterop: {},
  })

  const sideEffectPropertyName = 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP'

  Object.defineProperties(runtime, {
    getSideEffectsTimestamp: {
      get: () => () =>
        executeSagaListener.getProperty({
          eventSubscriber: currentSagaName,
          key: sideEffectPropertyName,
        }),
      enumerable: true,
    },
    setSideEffectsTimestamp: {
      get: () => (sideEffectTimestamp: number) =>
        executeSagaListener.setProperty({
          eventSubscriber: currentSagaName,
          key: sideEffectPropertyName,
          value: sideEffectTimestamp,
        }),
      enumerable: true,
    },
  })

  const buildSaga = async (
    params: CallMethodParams,
    o?: any, //TODO: what is this?
    ...args: any[]
  ) => {
    if (
      !(
        params !== undefined &&
        args.length === 0 &&
        Object(params) === params &&
        (Object(o) === o || o == null)
      )
    ) {
      throw new Error(
        `Invalid build saga args ${JSON.stringify([params, o, ...args])}`
      )
    }

    try {
      const { eventSubscriber, modelName, ...parameters } = params
      let eventSubscriberName: string

      if (eventSubscriber == null) {
        if (modelName == null) {
          throw new Error(`Both "eventSubscriber" and "modelName" are null`)
        }
        eventSubscriberName = modelName
      } else {
        eventSubscriberName = eventSubscriber
      }
      currentSagaName = eventSubscriberName

      return await executeSagaListener.build({
        modelName: eventSubscriberName,
        ...parameters,
      })
    } finally {
      if (currentSagaName == null) {
        throw new Error('Concurrent saga interop')
      }
      currentSagaName = null
    }
  }

  const executeSaga = new Proxy(executeSagaListener, {
    get(_, key: string) {
      if (key === 'build') {
        return buildSaga
      } else {
        return executeSagaListener[key].bind(executeSagaListener)
      }
    },
    set() {
      throw new TypeError(`Resolve-saga API is immutable`)
    },
  }) as SagaExecutor

  return executeSaga
}
