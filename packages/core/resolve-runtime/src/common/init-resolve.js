import createCommandExecutor from '../common/command/index'
import createQueryExecutor from '../common/query/index'
import createSagaExecutor from '../common/saga/index'
import crypto from 'crypto'

import createOnCommandExecuted from './on-command-executed'
import createEventListener from './event-listener'
import createEventBus from './event-bus'

const DEFAULT_WORKER_LIFETIME = 4 * 60 * 1000

const initResolve = async (resolve) => {
  const performanceTracer = resolve.performanceTracer

  const {
    eventstoreAdapter: createEventstoreAdapter,
    readModelConnectors: readModelConnectorsCreators,
  } = resolve.assemblies

  const {
    invokeEventBusAsync,
    readModels,
    sagas,
    viewModels,
    uploader,
    scheduler,
    monitoring,
    domainInterop,
  } = resolve

  const eventstoreAdapter = createEventstoreAdapter()

  const readModelConnectors = {}
  for (const name of Object.keys(readModelConnectorsCreators)) {
    readModelConnectors[name] = readModelConnectorsCreators[name]({
      performanceTracer,
      eventstoreAdapter,
    })
  }

  if (resolve.getVacantTimeInMillis == null) {
    const endTime = Date.now() + DEFAULT_WORKER_LIFETIME
    resolve.getVacantTimeInMillis = () => endTime - Date.now()
  }

  Object.defineProperties(resolve, {
    readModelConnectors: { value: readModelConnectors },
    eventstoreAdapter: { value: eventstoreAdapter },
  })

  const getVacantTimeInMillis = resolve.getVacantTimeInMillis
  const onCommandExecuted = createOnCommandExecuted(resolve)

  const performAcknowledge = resolve.publisher.acknowledge.bind(
    resolve.publisher
  )

  const domainMonitoring = {
    error: monitoring?.error,
    performance: performanceTracer,
  }

  const secretsManager = await eventstoreAdapter.getSecretsManager()

  const aggregateRuntime = {
    monitoring: domainMonitoring,
    secretsManager,
    eventstore: eventstoreAdapter,
    hooks: {
      preSaveEvent: async (aggregate, command, event) => {
        await onCommandExecuted(event, command)
        return false
      },
    },
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

  const executeQuery = createQueryExecutor({
    invokeEventBusAsync,
    eventstoreAdapter,
    readModelConnectors,
    readModels,
    viewModels,
    performanceTracer,
    getVacantTimeInMillis,
    performAcknowledge,
    monitoring,
    readModelsInterop: domainInterop.readModelDomain.acquireReadModelsInterop({
      monitoring: domainMonitoring,
      secretsManager,
    }),
    viewModelsInterop: domainInterop.viewModelDomain.acquireViewModelsInterop({
      monitoring: domainMonitoring,
      eventstore: eventstoreAdapter,
      secretsManager,
    }),
  })

  const executeSaga = createSagaExecutor({
    invokeEventBusAsync,
    executeCommand,
    executeQuery,
    eventstoreAdapter,
    secretsManager,
    readModelConnectors,
    sagas,
    performanceTracer,
    getVacantTimeInMillis,
    performAcknowledge,
    uploader,
    scheduler,
    monitoring,
    domainInterop,
    executeSchedulerCommand,
  })

  const eventBus = createEventBus(resolve)

  const eventListener = createEventListener(resolve)

  const eventStore = new Proxy(
    {},
    {
      get(_, key) {
        if (key === 'SaveEvent') {
          return async ({ event }) => await eventstoreAdapter.saveEvent(event)
        } else if (key === 'LoadEvents') {
          return async ({ scopeName, ...filter }) =>
            await (scopeName, eventstoreAdapter.loadEvents(filter))
        } else {
          return eventstoreAdapter[key[0].toLowerCase() + key.slice(1)].bind(
            eventstoreAdapter
          )
        }
      },
      set() {
        throw new Error(`Event store API is immutable`)
      },
    }
  )

  Object.assign(resolve, {
    executeCommand,
    executeQuery,
    executeSaga,
    executeSchedulerCommand,
  })

  Object.defineProperties(resolve, {
    eventListener: { value: eventListener },
    eventBus: { value: eventBus },
    eventStore: { value: eventStore },
  })

  process.env.RESOLVE_LOCAL_TRACE_ID = crypto
    .randomBytes(Math.ceil(32 / 2))
    .toString('hex')
    .slice(0, 32)
}

export default initResolve
