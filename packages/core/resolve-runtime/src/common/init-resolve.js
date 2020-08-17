import createCommandExecutor from 'resolve-command'
import createQueryExecutor, {
  detectConnectorFeatures,
  FULL_REGULAR_CONNECTOR,
  FULL_XA_CONNECTOR,
  EMPTY_CONNECTOR,
  INLINE_LEDGER_CONNECTOR
} from 'resolve-query'
import createSagaExecutor from 'resolve-saga'
import crypto from 'crypto'

const EVENT_BUS_METHODS = [
  'subscribe',
  'resubscribe',
  'unsubscribe',
  'deleteProperty',
  'getProperty',
  'listProperties',
  'setProperty',
  'resume',
  'pause',
  'reset',
  'status',
  'build'
]
const DEFAULT_WORKER_LIFETIME = 4 * 60 * 1000

const initResolve = async resolve => {
  const performanceTracer = resolve.performanceTracer

  const {
    eventstoreAdapter: createEventstoreAdapter,
    readModelConnectors: readModelConnectorsCreators
  } = resolve.assemblies

  const {
    invokeEventListenerAsync,
    aggregates,
    readModels,
    schedulers,
    sagas,
    viewModels,
    uploader
  } = resolve
  const eventstoreAdapter = createEventstoreAdapter()

  const readModelConnectors = {}
  for (const name of Object.keys(readModelConnectorsCreators)) {
    readModelConnectors[name] = readModelConnectorsCreators[name]({
      performanceTracer,
      eventstoreAdapter
    })
  }

  const onCommandExecuted = async (event) => {
    await resolve.publisher.publish({ event })
    await resolve.notifyInlineLedgers()
  }

  const executeCommand = createCommandExecutor({
    aggregates,
    eventstoreAdapter,
    performanceTracer,
    onCommandExecuted
  })

  const executeQuery = createQueryExecutor({
    invokeEventListenerAsync,
    eventstoreAdapter,
    readModelConnectors,
    readModels,
    viewModels,
    performanceTracer
  })

  const executeSaga = createSagaExecutor({
    invokeEventListenerAsync,
    executeCommand,
    executeQuery,
    onCommandExecuted,
    eventstoreAdapter,
    readModelConnectors,
    schedulers,
    sagas,
    performanceTracer,
    uploader
  })

  const eventBusMethod = async (key, ...args) => {
    if (args.length !== 1 || Object(args[0]) !== args[0]) {
      throw new TypeError(`Invalid EventBus method "${key}" arguments ${args}`)
    }

    let { eventSubscriber, modelName, ...parameters } = args[0]
    if (eventSubscriber == null && modelName == null) {
      throw new Error(`Either "eventSubscriber" nor "modelName" is null`)
    } else if (eventSubscriber == null) {
      eventSubscriber = modelName
    } else {
      modelName = eventSubscriber
    }

    const listenerInfo = resolve.eventListeners.get(eventSubscriber)
    if (listenerInfo == null) {
      throw new Error(`Listener ${eventSubscriber} does not exist`)
    }

    const connector = resolve.readModelConnectors[listenerInfo.connectorName]

    const isInlineLedger =
      resolve.detectConnectorFeatures(connector) ===
      resolve.connectorCapabilities.INLINE_LEDGER_CONNECTOR

    const method = isInlineLedger
      ? listenerInfo.isSaga
        ? resolve.executeSaga[key]
        : resolve.executeQuery[key]
      : resolve.publisher[key]

    if (typeof method != 'function') {
      throw new TypeError(key)
    }

    const result = await method(
      isInlineLedger
        ? { modelName, ...parameters }
        : { eventSubscriber, ...parameters }
    )

    return result
  }

  const eventBus = {}
  for (const key of EVENT_BUS_METHODS) {
    Object.defineProperty(eventBus, key, {
      value: eventBusMethod.bind(eventBus, key)
    })
  }
  Object.freeze(eventBus)

  Object.assign(resolve, {
    executeCommand,
    executeQuery,
    executeSaga,
    eventBus
  })

  const connectorCapabilities = {
    FULL_REGULAR_CONNECTOR,
    FULL_XA_CONNECTOR,
    EMPTY_CONNECTOR,
    INLINE_LEDGER_CONNECTOR
  }

  const notifyInlineLedgers = async () => {
    const maxDuration = Math.max(resolve.getRemainingTimeInMillis() - 15000, 0)
    let timerId = null
    const timerPromise = new Promise(resolve => {
      timerId = setTimeout(resolve, maxDuration)
    })
    const inlineLedgerPromise = (async () => {
      const promises = []
      for (const {
        name: eventListener,
        connectorName
      } of resolve.eventListeners.values()) {
        const connector = resolve.readModelConnectors[connectorName]
        if (
          resolve.detectConnectorFeatures(connector) ===
          resolve.connectorCapabilities.INLINE_LEDGER_CONNECTOR
        ) {
          promises.push(
            resolve.invokeEventListenerAsync(eventListener, 'build')
          )
        }
      }
      await Promise.all(promises)

      if (timerId != null) {
        clearTimeout(timerId)
      }
    })()

    await Promise.race([timerPromise, inlineLedgerPromise])
  }

  Object.defineProperties(resolve, {
    readModelConnectors: { value: readModelConnectors },
    eventstoreAdapter: { value: eventstoreAdapter },
    detectConnectorFeatures: { value: detectConnectorFeatures },
    connectorCapabilities: { value: connectorCapabilities },
    notifyInlineLedgers: { value: notifyInlineLedgers }
  })

  if (!resolve.hasOwnProperty('getRemainingTimeInMillis')) {
    const endTime = Date.now() + DEFAULT_WORKER_LIFETIME
    resolve.getRemainingTimeInMillis = () => endTime - Date.now()
  }

  process.env.RESOLVE_LOCAL_TRACE_ID = crypto
    .randomBytes(Math.ceil(32 / 2))
    .toString('hex')
    .slice(0, 32)
}

export default initResolve
