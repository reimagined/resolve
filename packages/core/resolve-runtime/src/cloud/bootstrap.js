import debugLevels from 'resolve-debug-levels'
import {
  ReadModelConnectorCapability,
  getConnectorCapability
} from 'resolve-query'

const log = debugLevels('resolve:resolve-runtime:bootstrap')

const deliveryStrategies = new Map()
deliveryStrategies.set(
  ReadModelConnectorCapability.None,
  'active-none-transaction'
)
deliveryStrategies.set(
  ReadModelConnectorCapability.Regular,
  'active-regular-transaction'
)
deliveryStrategies.set(ReadModelConnectorCapability.XA, 'active-xa-transaction')

const bootstrap = async resolve => {
  log.debug('bootstrap started')
  const { readModelConnectors, publisher } = resolve

  const promises = []
  for (const {
    name: eventSubscriber,
    eventTypes,
    connectorName
  } of resolve.eventListeners.values()) {
    const deliveryStrategy = deliveryStrategies.get(
      getConnectorCapability(readModelConnectors[connectorName])
    )

    const subscriptionOptions = {
      deliveryStrategy,
      credentials: resolve.eventSubscriberCredentials,
      eventTypes
    }

    const subscribePromise = publisher.subscribe({
      eventSubscriber,
      subscriptionOptions
    })

    promises.push(subscribePromise)

    const resumePromise = subscribePromise
      .then(
        publisher.setProperty.bind(publisher, {
          eventSubscriber,
          key: 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP',
          value: `${Date.now()}`
        })
      )
      .then(publisher.resume.bind(publisher, { eventSubscriber }))
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
