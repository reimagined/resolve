import {
  detectConnectorFeatures,
  FULL_REGULAR_CONNECTOR,
  FULL_XA_CONNECTOR,
  EMPTY_CONNECTOR,
  INLINE_LEDGER_CONNECTOR,
} from './query'

const connectorCapabilities = {
  FULL_REGULAR_CONNECTOR,
  FULL_XA_CONNECTOR,
  EMPTY_CONNECTOR,
  INLINE_LEDGER_CONNECTOR,
}

const eventBusMethod = async (resolve, key, ...args) => {
  if (args.length !== 1 || Object(args[0]) !== args[0]) {
    throw new TypeError(
      `Invalid EventBus method "${key}" arguments ${JSON.stringify(args)}`
    )
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
    detectConnectorFeatures(connector) ===
    connectorCapabilities.INLINE_LEDGER_CONNECTOR

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

const createEventBus = (resolve) => {
  const eventBus = new Proxy(
    {},
    {
      get(_, key) {
        return eventBusMethod.bind(null, resolve, key)
      },
      set() {
        throw new Error(`Event bus API is immutable`)
      },
    }
  )

  return eventBus
}

export default createEventBus
