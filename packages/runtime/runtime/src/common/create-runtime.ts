import { CommandExecutor, createCommandExecutor } from '../common/command/index'
import { createQueryExecutor } from '../common/query/index'
import { createSagaExecutor } from './saga'
import type {
  AggregateInterop,
  Command,
  Monitoring,
  PerformanceTracer,
  StoredEventPointer,
} from '@resolve-js/core'
import { Adapter } from '@resolve-js/eventstore-base'
import type {
  Assemblies,
  EventSubscriber,
  EventSubscriberNotifier,
  QueryExecutor,
  ReactiveEventDispatcher,
  ReactiveSubscriptionFactory,
  ReadModelConnector,
  ReadModelConnectorFactory,
  Resolve,
  SagaExecutor,
  Scheduler,
  Uploader,
} from './types'
import { getLog } from './utils/get-log'
import { eventBroadcastFactory } from './event-broadcast-factory'
import { commandExecutedHookFactory } from './command-executed-hook-factory'
import { eventSubscriberFactory } from './event-subscriber'
import { readModelProcedureLoaderFactory } from './load-read-model-procedure'

export type EventStoreAdapterFactory = () => Adapter

export type RuntimeFactoryParameters = {
  // TODO: missed types
  readonly seedClientEnvs: Assemblies['seedClientEnvs']
  readonly serverImports: Assemblies['serverImports']
  readonly domain: Resolve['domain']
  readonly domainInterop: Resolve['domainInterop']
  readonly performanceTracer: PerformanceTracer
  readonly monitoring: Monitoring
  readonly eventStoreAdapterFactory: EventStoreAdapterFactory
  readonly readModelConnectorsFactories: Record<
    string,
    ReadModelConnectorFactory
  >
  readonly getVacantTimeInMillis: () => number
  readonly eventSubscriberScope: string
  readonly notifyEventSubscriber: EventSubscriberNotifier
  readonly invokeBuildAsync: Resolve['invokeBuildAsync']
  readonly eventListeners: Resolve['eventListeners']
  readonly sendReactiveEvent: ReactiveEventDispatcher
  readonly getReactiveSubscription: ReactiveSubscriptionFactory
  readonly uploader: Resolve['uploader'] | null
  scheduler?: Resolve['scheduler']
}

export type Runtime = {
  readonly eventStoreAdapter: Adapter
  readonly uploader: Uploader | null
  readonly executeCommand: CommandExecutor
  readonly executeQuery: QueryExecutor
  readonly executeSaga: SagaExecutor
  readonly eventSubscriber: EventSubscriber
  readonly executeSchedulerCommand: CommandExecutor
  readonly readModelConnectors: Record<string, ReadModelConnector>
  readonly getReactiveSubscription: ReactiveSubscriptionFactory
  readonly dispose: () => Promise<void>
}

const buildReadModelConnectors = (
  factories: Record<string, ReadModelConnectorFactory>,
  performanceTracer: PerformanceTracer,
  monitoring: Monitoring
): Resolve['readModelConnectors'] =>
  Object.keys(factories).reduce<Resolve['readModelConnectors']>(
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
    throw Error(`Scheduler was not provided by runtime`)
  },
  clearEntries: () => {
    throw Error(`Scheduler was not provided by runtime`)
  },
  addEntries: () => {
    throw Error(`Scheduler was not provided by runtime`)
  },
}

const dispose = async (runtime: Runtime) => {
  const log = getLog(`dispose`)
  try {
    const disposePromises: Promise<void>[] = [
      runtime.executeCommand.dispose(),
      runtime.executeQuery.dispose(),
      runtime.executeSaga.dispose(),
      runtime.eventStoreAdapter.dispose(),
    ]

    for (const name of Object.keys(runtime.readModelConnectors)) {
      disposePromises.push(runtime.readModelConnectors[name].dispose())
    }

    log.debug(`awaiting ${disposePromises.length} entries to dispose`)

    await Promise.all(disposePromises)

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

  const {
    performanceTracer,
    monitoring,
    eventStoreAdapterFactory,
    readModelConnectorsFactories,
  } = params

  log.debug(`building event store adapter`)
  const eventStoreAdapter = await eventStoreAdapterFactory()

  log.debug(`building read models connectors`)
  const readModelConnectors = buildReadModelConnectors(
    readModelConnectorsFactories,
    performanceTracer,
    monitoring
  )
  log.debug(`${Object.keys(readModelConnectors).length} connectors built`)

  const {
    getVacantTimeInMillis,
    eventSubscriberScope,
    eventListeners,
    invokeBuildAsync,
    notifyEventSubscriber,
  } = params

  const broadcastEvent = eventBroadcastFactory({
    eventStoreAdapter,
    getVacantTimeInMillis,
    eventSubscriberScope,
    notifyEventSubscriber,
    invokeBuildAsync,
    eventListeners,
  })

  const { sendReactiveEvent } = params
  const onCommandExecuted = commandExecutedHookFactory({
    sendReactiveEvent,
    broadcastEvent,
  })

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

  const executeQuery = createQueryExecutor({
    invokeBuildAsync,
    applicationName: eventSubscriberScope,
    eventstoreAdapter: eventStoreAdapter,
    readModelConnectors,
    loadReadModelProcedure,
    performanceTracer,
    getVacantTimeInMillis,
    monitoring,
    readModelsInterop: domainInterop.readModelDomain.acquireReadModelsInterop({
      monitoring,
      secretsManager,
      resolverMiddlewares,
      projectionMiddlewares,
    }),
    viewModelsInterop: domainInterop.viewModelDomain.acquireViewModelsInterop({
      monitoring,
      eventstore: eventStoreAdapter,
      secretsManager,
    }),
  })

  const { uploader } = params

  const getScheduler = () => params.scheduler ?? schedulerGuard

  const executeSaga = createSagaExecutor({
    invokeBuildAsync,
    applicationName: eventSubscriberScope,
    executeCommand,
    executeQuery,
    eventstoreAdapter: eventStoreAdapter,
    secretsManager,
    readModelConnectors,
    performanceTracer,
    getVacantTimeInMillis,
    uploader,
    getScheduler,
    monitoring,
    domainInterop,
    executeSchedulerCommand,
  })

  const eventSubscriber = eventSubscriberFactory({
    executeQuery,
    executeSaga,
    eventListeners,
  })

  const { getReactiveSubscription } = params

  const runtime = {
    eventStoreAdapter,
    uploader,
    executeCommand,
    executeQuery,
    executeSaga,
    eventSubscriber,
    executeSchedulerCommand,
    readModelConnectors,
    getReactiveSubscription,
    dispose: async function () {
      await dispose(this)
    },
  }

  return runtime
}
