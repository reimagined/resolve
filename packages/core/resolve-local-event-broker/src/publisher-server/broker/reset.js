import {
  RESUBSCRIBE_SYMBOL,
  SUBSCRIBER_OPTIONS_FETCH_SYMBOL
} from '../constants'

const reset = async (pool, eventSubscriber) => {
  const { ensureOrResetSubscription, getSubscriberOptions, consumer } = pool
  const subscriptionOptions = await getSubscriberOptions(
    pool,
    SUBSCRIBER_OPTIONS_FETCH_SYMBOL,
    eventSubscriber,
    ['eventTypes', 'aggregateIds', 'deliveryStrategy']
  )

  await consumer.drop(eventSubscriber)

  return await ensureOrResetSubscription(
    pool,
    RESUBSCRIBE_SYMBOL,
    eventSubscriber,
    subscriptionOptions
  )
}

export default reset
