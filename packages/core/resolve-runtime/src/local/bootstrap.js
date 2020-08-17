import { EventstoreResourceAlreadyExistError } from 'resolve-eventstore-base'
import { PublisherResourceAlreadyExistError } from 'resolve-local-event-broker'

import debugLevels from 'resolve-debug-levels'
import {
  FULL_XA_CONNECTOR,
  FULL_REGULAR_CONNECTOR,
  EMPTY_CONNECTOR,
  INLINE_LEDGER_CONNECTOR,
  detectConnectorFeatures
} from 'resolve-query'

import invokeFilterErrorTypes from '../common/utils/invoke-filter-error-types'

const log = debugLevels('resolve:resolve-runtime:bootstrap')

const bootstrapOne = async (
  resolve,
  eventSubscriber,
  eventTypes,
  connectorName
) => {
  const {
    assemblies: {
      eventBrokerConfig: { upstream }
    },
    readModelConnectors,
    eventBus
  } = resolve

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
    return
  }
  try {
    await eventBus.subscribe({
      eventSubscriber,
      subscriptionOptions: {
        deliveryStrategy,
        eventTypes
      }
    })

    if (upstream) {
      await eventBus.setProperty({
        eventSubscriber,
        key: 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP',
        value: `${Date.now()}`
      })

      await eventBus.resume({ eventSubscriber })
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`
      Event listener "${eventSubscriber}" can't resume subscription since event bus
      cannot initiate notification for it because of error "${error}"
    `)
  }
}

const bootstrap = async resolve => {
  log.debug('bootstrap started')
  const { eventstoreAdapter, eventBus, publisher } = resolve

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
      bootstrapOne(resolve, eventSubscriber, eventTypes, connectorName)
    )
  }

  await Promise.all(promises)

  await eventBus.subscribe({
    eventSubscriber: 'websocket',
    subscriptionOptions: { deliveryStrategy: 'passthrough' }
  })

  await eventBus.resume({ eventSubscriber: 'websocket' })

  log.debug('bootstrap successful')

  return 'ok'
}

export default bootstrap
