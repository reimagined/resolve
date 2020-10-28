import {
  detectConnectorFeatures,
  FULL_REGULAR_CONNECTOR,
  FULL_XA_CONNECTOR,
  EMPTY_CONNECTOR,
  INLINE_LEDGER_CONNECTOR,
} from 'resolve-query'

import makeTimer from './utils/make-timer'

const connectorCapabilities = {
  FULL_REGULAR_CONNECTOR,
  FULL_XA_CONNECTOR,
  EMPTY_CONNECTOR,
  INLINE_LEDGER_CONNECTOR,
}

const notifyInlineLedgers = async (resolve, inlineLedgerEventListeners) => {
  const maxDuration = Math.max(resolve.getRemainingTimeInMillis() - 15000, 0)
  const { timerPromise, timerStop } = makeTimer(maxDuration)
  const listenerPromises = inlineLedgerEventListeners.map((eventListener) =>
    resolve.invokeEventBusAsync(eventListener, 'build')
  )
  const inlineLedgerPromise = Promise.all(listenerPromises).then(timerStop)

  await Promise.race([timerPromise, inlineLedgerPromise])
}

const publisherSaveEvent = async (resolve, event) => {
  await resolve.publisher.publish({ event })
}
const localSaveEvent = async (resolve, event) => {
  await resolve.eventStore.saveEvent({ event })
}

const emptyFunction = Function('') // eslint-disable-line no-new-func

const onCommandExecuted = async (publishEvent, notifyEvent, event) => {
  await publishEvent(event)
  await notifyEvent(event)
}

const createOnCommandExecuted = (resolve) => {
  const inlineLedgerEventListeners = []
  let hasBrokerEventListeners = resolve.viewModels.length > 0

  for (const {
    name: eventListener,
    connectorName,
  } of resolve.eventListeners.values()) {
    const connector = resolve.readModelConnectors[connectorName]
    if (
      detectConnectorFeatures(connector) ===
      connectorCapabilities.INLINE_LEDGER_CONNECTOR
    ) {
      inlineLedgerEventListeners.push(eventListener)
    } else {
      hasBrokerEventListeners = true
    }
  }

  // TODO improve websocket reactivity
  const publishEvent =
    hasBrokerEventListeners || inlineLedgerEventListeners.length === 0
      ? publisherSaveEvent.bind(null, resolve)
      : localSaveEvent.bind(null, resolve)

  const notifyEvent =
    inlineLedgerEventListeners.length > 0
      ? notifyInlineLedgers.bind(null, resolve, inlineLedgerEventListeners)
      : emptyFunction

  return onCommandExecuted.bind(null, publishEvent, notifyEvent)
}

export default createOnCommandExecuted
