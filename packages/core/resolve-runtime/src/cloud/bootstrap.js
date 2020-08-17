import debugLevels from 'resolve-debug-levels'
import {
  FULL_XA_CONNECTOR,
  FULL_REGULAR_CONNECTOR,
  EMPTY_CONNECTOR,
  INLINE_LEDGER_CONNECTOR,
  detectConnectorFeatures
} from 'resolve-query'

const log = debugLevels('resolve:resolve-runtime:bootstrap')

const bootstrap = async resolve => {
  log.debug('bootstrap started')
  const { readModelConnectors, publisher, eventBus } = resolve

  const promises = []
  for (const {
    name: eventSubscriber,
    eventTypes,
    connectorName
  } of resolve.eventListeners.values()) {
    const connectorFeatures = detectConnectorFeatures(
      readModelConnectors[connectorName]
    )
    let deliveryStrategy = null
    switch (connectorFeatures) {
      case FULL_XA_CONNECTOR:
        deliveryStrategy = 'active-xa-transaction'
        break
      case FULL_XA_CONNECTOR + FULL_REGULAR_CONNECTOR:
        deliveryStrategy = 'active-xa-transaction'
        break
      case FULL_REGULAR_CONNECTOR:
        deliveryStrategy = 'active-regular-transaction'
        break
      case EMPTY_CONNECTOR:
        deliveryStrategy = 'active-none-transaction'
        break
      case INLINE_LEDGER_CONNECTOR:
        deliveryStrategy = 'inline-ledger'
        break
      default:
        break
    }

    if (deliveryStrategy == null) {
      // eslint-disable-next-line no-console
      console.warn(`
        Event listener "${eventSubscriber}" can't perform subscription since event bus
        does not support connector capacities mask "${connectorFeatures}"
      `)
      continue
    }

    const subscriptionOptions = {
      deliveryStrategy,
      credentials: resolve.eventSubscriberCredentials,
      eventTypes
    }

    const subscribePromise = eventBus.subscribe({
      eventSubscriber,
      subscriptionOptions
    })

    promises.push(subscribePromise)

    const resumePromise = subscribePromise
      .then(
        eventBus.setProperty.bind(eventBus, {
          eventSubscriber,
          key: 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP',
          value: `${Date.now()}`
        })
      )
      .then(eventBus.resume.bind(eventBus, { eventSubscriber }))
      .catch(error => {
        // eslint-disable-next-line no-console
        console.warn(`
          Event listener "${eventSubscriber}" can't resume subscription since event bus
          cannot initiate notification for it because of error "${error}"
        `)
      })

    promises.push(resumePromise)
  }

  await Promise.all(promises)

  await publisher.subscribe({
    eventSubscriber: 'websocket',
    subscriptionOptions: {
      credentials: resolve.eventSubscriberCredentials,
      deliveryStrategy: 'passthrough'
    }
  })

  await publisher.resume({ eventSubscriber: 'websocket' })

  log.debug('bootstrap successful')

  return 'ok'
}

export default bootstrap
