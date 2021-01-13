import {
  detectConnectorFeatures,
  EMPTY_CONNECTOR,
  FULL_REGULAR_CONNECTOR,
  FULL_XA_CONNECTOR,
  INLINE_LEDGER_CONNECTOR,
} from './query'

const bootstrapOne = async ({
  readModelConnectors,
  eventBus,
  eventSubscriber,
  eventTypes,
  connectorName,
  credentials,
  upstream,
}) => {
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
        ...(credentials != null ? { credentials } : {}),
        deliveryStrategy,
        eventTypes,
      },
    })

    if (upstream) {
      await eventBus.setProperty({
        eventSubscriber,
        key: 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP',
        value: `${Date.now()}`,
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

export default bootstrapOne
