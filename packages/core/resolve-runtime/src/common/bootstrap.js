import debugLevels from 'resolve-debug-levels'

import bootstrapOne from './bootstrap-one'

const log = debugLevels('resolve:resolve-runtime:bootstrap')

const bootstrap = async (resolve, upstream) => {
  log.debug('bootstrap started')
  const promises = []
  for (const {
    name: eventSubscriber,
    eventTypes,
    connectorName,
  } of resolve.eventListeners.values()) {
    promises.push(
      bootstrapOne({
        readModelConnectors: resolve.readModelConnectors,
        eventBus: resolve.eventBus,
        eventSubscriber,
        eventTypes,
        connectorName,
        credentials: resolve.eventSubscriberCredentials,
        upstream,
      })
    )
  }

  await Promise.all(promises)

  await resolve.publisher.subscribe({
    eventSubscriber: 'websocket',
    subscriptionOptions: {
      credentials: resolve.eventSubscriberCredentials,
      deliveryStrategy: 'passthrough',
    },
  })

  await resolve.publisher.resume({ eventSubscriber: 'websocket' })

  log.debug('bootstrap successful')

  return 'ok'
}

export default bootstrap
