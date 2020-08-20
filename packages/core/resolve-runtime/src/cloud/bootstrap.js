import debugLevels from 'resolve-debug-levels'

import bootstrapOne from '../common/bootstrap-one'

const log = debugLevels('resolve:resolve-runtime:bootstrap')

const bootstrap = async resolve => {
  log.debug('bootstrap started')
  const promises = []
  for (const {
    name: eventSubscriber,
    eventTypes,
    connectorName
  } of resolve.eventListeners.values()) {
    promises.push(
      bootstrapOne(resolve, eventSubscriber, eventTypes, connectorName, true)
    )
  }

  await Promise.all(promises)

  await resolve.publisher.subscribe({
    eventSubscriber: 'websocket',
    subscriptionOptions: {
      credentials: resolve.eventSubscriberCredentials,
      deliveryStrategy: 'passthrough'
    }
  })

  await resolve.publisher.resume({ eventSubscriber: 'websocket' })

  log.debug('bootstrap successful')

  return 'ok'
}

export default bootstrap
