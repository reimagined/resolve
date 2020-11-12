import createCommandExecutor from 'resolve-command'
import createQueryExecutor from 'resolve-query'
import createSagaExecutor from 'resolve-saga'
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
    aggregates,
    readModels,
    schedulers,
    sagas,
    viewModels,
    uploader,
    onError,
  } = resolve
  const eventstoreAdapter = createEventstoreAdapter()

  const readModelConnectors = {}
  for (const name of Object.keys(readModelConnectorsCreators)) {
    readModelConnectors[name] = readModelConnectorsCreators[name]({
      performanceTracer,
      eventstoreAdapter,
    })
  }

  if (!resolve.hasOwnProperty('getRemainingTimeInMillis')) {
    const endTime = Date.now() + DEFAULT_WORKER_LIFETIME
    resolve.getRemainingTimeInMillis = () => endTime - Date.now()
  }

  const getRemainingTimeInMillis = resolve.getRemainingTimeInMillis
  const onCommandExecuted = createOnCommandExecuted(resolve)

  const performAcknowledge = resolve.publisher.acknowledge.bind(
    resolve.publisher
  )

  const executeCommand = createCommandExecutor({
    aggregates,
    eventstoreAdapter,
    performanceTracer,
    onCommandExecuted,
    onError,
  })

  const executeQuery = createQueryExecutor({
    invokeEventBusAsync,
    eventstoreAdapter,
    readModelConnectors,
    readModels,
    viewModels,
    performanceTracer,
    getRemainingTimeInMillis,
    performAcknowledge,
    onError,
  })

  const executeSaga = createSagaExecutor({
    invokeEventBusAsync,
    executeCommand,
    executeQuery,
    onCommandExecuted,
    eventstoreAdapter,
    readModelConnectors,
    schedulers,
    sagas,
    performanceTracer,
    getRemainingTimeInMillis,
    performAcknowledge,
    uploader,
    onError,
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
  })

  Object.defineProperties(resolve, {
    readModelConnectors: { value: readModelConnectors },
    eventstoreAdapter: { value: eventstoreAdapter },
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
