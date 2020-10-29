import {
  detectConnectorFeatures,
  FULL_REGULAR_CONNECTOR,
  FULL_XA_CONNECTOR,
  EMPTY_CONNECTOR,
  INLINE_LEDGER_CONNECTOR,
} from 'resolve-query'

const connectorCapabilities = {
  FULL_REGULAR_CONNECTOR,

  FULL_XA_CONNECTOR,

  EMPTY_CONNECTOR,

  INLINE_LEDGER_CONNECTOR,
}

const notifyInlineLedgers = async (resolve) => {
  const maxDuration = Math.max(resolve.getRemainingTimeInMillis() - 15000, 0)

  let timerId = null

  const timerPromise = new Promise((resolve) => {
    timerId = setTimeout(resolve, maxDuration)
  })

  const inlineLedgerPromise = (async () => {
    const promises = []

    for (const {
      name: eventListener,

      connectorName,
    } of resolve.eventListeners.values()) {
      const connector = resolve.readModelConnectors[connectorName]

      if (
        detectConnectorFeatures(connector) ===
        connectorCapabilities.INLINE_LEDGER_CONNECTOR
      ) {
        promises.push(resolve.invokeEventBusAsync(eventListener, 'build'))
      }
    }

    await Promise.all(promises)

    if (timerId != null) {
      clearTimeout(timerId)
    }
  })()

  await Promise.race([timerPromise, inlineLedgerPromise])
}

const onCommandExecuted = async (resolve, event) => {
  await resolve.publisher.publish({ event })

  await notifyInlineLedgers(resolve)
}

const createOnCommandExecuted = (resolve) => {
  return onCommandExecuted.bind(null, resolve)
}

export default createOnCommandExecuted
