import partial from 'lodash.partial'
import { createCommandExecutor } from './command'
import { createQueryExecutor } from './query'
import type {
  AggregateInterop,
  Command,
  Monitoring,
  PerformanceTracer,
  StoredEventPointer,
} from '@resolve-js/core'
import { Adapter } from '@resolve-js/eventstore-base'
import type {
  ReadModelConnectorFactory,
  Runtime,
  RuntimeFactoryParameters,
  Scheduler,
  EventSubscriber,
  UnPromise,
} from './types'
import { getLog } from './utils/get-log'
import { eventBroadcastFactory } from './event-broadcast-factory'
import { commandExecutedHookFactory } from './command-executed-hook-factory'
import eventSubscriberFactory from './event-subscriber'
import { readModelProcedureLoaderFactory } from './load-read-model-procedure'
import { eventListenersManagerFactory } from './event-listeners-manager-factory'
import sideEffectTimestampProviderFactory from './side-effect-timestamp-provider'
import nextNotification from './notification-next'

export type EventStoreAdapterFactory = () => Adapter

const buildReadModelConnectors = (
  factories: Record<string, ReadModelConnectorFactory>,
  performanceTracer: PerformanceTracer,
  monitoring: Monitoring
): Runtime['readModelConnectors'] =>
  Object.keys(factories).reduce<Runtime['readModelConnectors']>(
    (connectors, name) => {
      connectors[name] = factories[name]({
        performanceTracer,
        monitoring,
      })
      return connectors
    },
    {}
  )

const schedulerGuard: Scheduler = {
  executeEntries: () => {
    throw Error(`executeEntries: scheduler was not provided by runtime`)
  },
  clearEntries: () => {
    throw Error(`clearEntries: scheduler was not provided by runtime`)
  },
  addEntries: () => {
    throw Error(`addEntries: scheduler was not provided by runtime`)
  },
}

const dispose = async (runtime: Runtime) => {
  const log = getLog(`dispose`)
  try {
    log.debug('publishing metrics')

    await runtime?.monitoring?.publish({ source: 'resolveDispose' })

    log.debug(`metrics published`)

    const disposeMethods: Array<() => Promise<void>> = [
      runtime.eventStoreAdapter.dispose.bind(runtime.eventStoreAdapter),
    ]

    for (const name of Object.keys(runtime.readModelConnectors)) {
      disposeMethods.push(
        runtime.readModelConnectors[name].dispose.bind(
          runtime.readModelConnectors[name]
        )
      )
    }

    let disposeErrors: Array<Error> = []
    const disposePromises: Promise<void>[] = disposeMethods.map((method) =>
      Promise.resolve()
        .then(method)
        .catch((error) => void disposeErrors.push(error))
    )

    log.debug(`awaiting ${disposePromises.length} entries to dispose`)

    await Promise.all(disposePromises)

    disposeErrors = disposeErrors.filter(
      (error) => error?.name !== 'AlreadyDisposedError'
    )

    if (disposeErrors.length > 0) {
      const summaryError = new Error(
        disposeErrors.map((error) => error?.message).join('\n')
      )
      summaryError.stack = disposeErrors.map((error) => error?.stack).join('\n')
      throw summaryError
    }

    log.info('resolve entries are disposed')
  } catch (error) {
    log.error('error disposing resolve entries')
    log.error(error)
  }
}

export const createRuntime = async (
  params: RuntimeFactoryParameters
): Promise<Runtime> => {
  const log = getLog(`createResolve`)
  const creationTime = Date.now()

  const {
    performanceTracer,
    monitoring,
    eventStoreAdapterFactory,
    readModelConnectorsFactories,
  } = params

  log.debug(`building event store adapter`)
  const eventStoreAdapter = await eventStoreAdapterFactory()
  eventStoreAdapter.setMonitoring(monitoring)

  log.debug(`building read models connectors`)
  const readModelConnectors = buildReadModelConnectors(
    readModelConnectorsFactories,
    performanceTracer,
    monitoring
  )
  log.debug(`${Object.keys(readModelConnectors).length} connectors built`)

  const {
    eventSubscriberScope,
    eventListeners,
    invokeBuildAsync,
    notifyEventSubscriber,
  } = params
  const getVacantTimeInMillis = partial(
    params.getVacantTimeInMillis,
    () => creationTime
  )

  const secretsManager = await eventStoreAdapter.getSecretsManager()

  const { domain, domainInterop } = params

  const {
    command: commandMiddlewares = [],
    resolver: resolverMiddlewares = [],
    projection: projectionMiddlewares = [],
  } = domain.middlewares ?? {}

  const aggregateRuntime = {
    monitoring,
    secretsManager,
    eventstore: eventStoreAdapter,
    hooks: {
      postSaveEvent: async (
        aggregate: AggregateInterop,
        command: Command,
        eventPointer: StoredEventPointer
      ) => {
        await onCommandExecuted(command, eventPointer)
      },
    },
    commandMiddlewares,
  }

  const executeCommand = createCommandExecutor({
    performanceTracer,
    aggregatesInterop: domainInterop.aggregateDomain.acquireAggregatesInterop(
      aggregateRuntime
    ),
  })

  const executeSchedulerCommand = createCommandExecutor({
    performanceTracer,
    aggregatesInterop: domainInterop.sagaDomain.acquireSchedulerAggregatesInterop(
      aggregateRuntime
    ),
  })

  const loadReadModelProcedure = readModelProcedureLoaderFactory({
    readModels: domain.readModels,
  })

  const {
    getEventSubscriberDestination,
    deleteQueue,
    ensureQueue,
    upstream,
    uploader,
  } = params

  const readModelsInterop = domainInterop.readModelDomain.acquireReadModelsInterop(
    {
      monitoring,
      secretsManager,
      resolverMiddlewares,
      projectionMiddlewares,
    }
  )

  const viewModelsInterop = domainInterop.viewModelDomain.acquireViewModelsInterop(
    {
      monitoring,
      eventstore: eventStoreAdapter,
      secretsManager,
    }
  )

  // TODO ????
  const getScheduler = (): any => {
    if (params.scheduler != null) {
      log.debug(`actual scheduler bound`)
      return params.scheduler
    }
    log.debug(`scheduler guard retrieved`)
    return schedulerGuard
  }

  const executeCommandForSaga = async (options: any) => {
    const aggregateName = options.aggregateName
    if (aggregateName === domainInterop.sagaDomain.schedulerName) {
      return await executeSchedulerCommand(options)
    } else {
      return await executeCommand(options)
    }
  }

  const sideEffectTimestampProvider = sideEffectTimestampProviderFactory(
    eventStoreAdapter,
    eventSubscriberScope
  )
  const sagasInterop = domainInterop.sagaDomain.acquireSagasInterop({
    // TODO ????
    get scheduler() {
      return getScheduler()
    },
    get getSideEffectsTimestamp() {
      return sideEffectTimestampProvider.getSideEffectsTimestamp
    },
    get setSideEffectsTimestamp() {
      return sideEffectTimestampProvider.setSideEffectsTimestamp
    },
    // TODO ????
    executeCommand: executeCommandForSaga,
    get executeQuery() {
      return executeQuery
    },
    secretsManager,
    monitoring,
    uploader,
  })

  const eventSubscriberImpl = eventSubscriberFactory({
    applicationName: eventSubscriberScope,
    setCurrentEventSubscriber:
      sideEffectTimestampProvider.setCurrentEventSubscriber,
    getEventSubscriberDestination,
    loadReadModelProcedure,
    readModelConnectors,
    getVacantTimeInMillis,
    eventstoreAdapter: eventStoreAdapter,
    readModelsInterop,
    sagasInterop,
    performanceTracer,
    monitoring,
  })

  // TODO ???
  const eventSubscriber = {
    ...eventSubscriberImpl,
    resume: async (
      ...args: Parameters<EventSubscriber['resume']>
    ): Promise<UnPromise<ReturnType<EventSubscriber['resume']>>> => {
      const notification = await eventSubscriberImpl.resume(...args)
      // TODO ???
      const eventSubscriberName =
        args[0].eventSubscriber ?? args[0].modelName ?? null
      await nextNotification(
        invokeBuildAsync,
        notification,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        eventSubscriberName!
      )
      //
      return notification
    },
    build: async (
      ...args: Parameters<EventSubscriber['build']>
    ): Promise<UnPromise<ReturnType<EventSubscriber['build']>>> => {
      const notification = await eventSubscriberImpl.build(...args)
      // TODO ???
      const eventSubscriberName =
        args[0].eventSubscriber ?? args[0].modelName ?? null
      await nextNotification(
        invokeBuildAsync,
        notification,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        eventSubscriberName!
      )
      //
      return notification
    },
  }
  //

  const executeQuery = createQueryExecutor({
    get eventSubscriber() {
      return eventSubscriber
    },
    readModelConnectors,
    readModelsInterop,
    viewModelsInterop,
    performanceTracer,
    monitoring,
  })

  const sagaReadGuard = async () => {
    throw new Error('Read from saga is prohibited')
  }
  const executeSaga = Object.assign(sagaReadGuard, {
    read: sagaReadGuard,
    serializeState: sagaReadGuard,
    ...eventSubscriber,
  })

  const eventListenersManager = eventListenersManagerFactory(
    {
      eventSubscriber,
      eventListeners,
      eventStoreAdapter,
    },
    {
      upstream,
      eventSubscriberScope,
      deleteQueue,
      ensureQueue,
    }
  )

  const { getReactiveSubscription } = params

  const broadcastEvent = eventBroadcastFactory({
    eventStoreAdapter,
    getVacantTimeInMillis,
    eventSubscriberScope,
    notifyEventSubscriber,
    invokeBuildAsync,
    eventSubscriber,
    eventListeners,
  })

  const { sendReactiveEvent } = params
  const onCommandExecuted = commandExecutedHookFactory({
    sendReactiveEvent,
    broadcastEvent,
  })

  const { serverImports } = params

  const runtime: Runtime = {
    eventStoreAdapter,
    uploader,
    executeCommand,
    executeQuery,
    executeSaga,
    eventSubscriber,
    executeSchedulerCommand,
    readModelConnectors,
    getReactiveSubscription,
    eventListenersManager,
    dispose: async function () {
      await dispose(this)
    },
    broadcastEvent,
    monitoring,
    serverImports,
  }

  return runtime
}
