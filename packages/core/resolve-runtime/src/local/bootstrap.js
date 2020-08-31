import { EventstoreResourceAlreadyExistError } from 'resolve-eventstore-base'
import { PublisherResourceAlreadyExistError } from 'resolve-local-event-broker'

import debugLevels from 'resolve-debug-levels'

import invokeFilterErrorTypes from '../common/utils/invoke-filter-error-types'
import bootstrapOne from '../common/bootstrap-one'

const log = debugLevels('resolve:resolve-runtime:bootstrap')

const bootstrap = async resolve => {
  log.debug('bootstrap started')
  const {
    assemblies: {
      eventBrokerConfig: { upstream }
    },
    eventstoreAdapter,
    publisher
  } = resolve

  await invokeFilterErrorTypes(eventstoreAdapter.init.bind(eventstoreAdapter), [
    EventstoreResourceAlreadyExistError
  ])
  await invokeFilterErrorTypes(publisher.init.bind(publisher), [
    PublisherResourceAlreadyExistError
  ])

  const promises = []
  for (const {
    name: eventSubscriber,
    eventTypes,
    connectorName
  } of resolve.eventListeners.values()) {
    promises.push(
      bootstrapOne({
        readModelConnectors: resolve.readModelConnectors,
        eventBus: resolve.eventBus,
        eventSubscriber,
        eventTypes,
        connectorName,
        credentials: null,
        upstream
      })
    )
  }

  await Promise.all(promises)

  await publisher.subscribe({
    eventSubscriber: 'websocket',
    subscriptionOptions: { deliveryStrategy: 'passthrough' }
  })

  await publisher.resume({ eventSubscriber: 'websocket' })

  log.debug('bootstrap successful')

  return 'ok'
}

export default bootstrap
