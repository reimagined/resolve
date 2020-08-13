import { EventstoreResourceAlreadyExistError } from 'resolve-eventstore-base'
import { PublisherResourceAlreadyExistError } from 'resolve-local-event-broker'

import debugLevels from 'resolve-debug-levels'
import {
  FULL_XA_CONNECTOR,
  FULL_REGULAR_CONNECTOR,
  EMPTY_CONNECTOR,
  PASSIVE_CONNECTOR,
  detectConnectorFeatures
} from 'resolve-query'

import invokeFilterErrorTypes from '../common/utils/invoke-filter-error-types'

const log = debugLevels('resolve:resolve-runtime:bootstrap')

const bootstrap = async resolve => {
  log.debug('bootstrap started')
  const {
    assemblies: {
      eventBrokerConfig: { upstream }
    },
    readModelConnectors,
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
      case PASSIVE_CONNECTOR:
        deliveryStrategy = 'passive'
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
      eventTypes
    }

    const subscribePromise = publisher.subscribe({
      eventSubscriber,
      subscriptionOptions
    })

    promises.push(subscribePromise)

    if (upstream) {
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
