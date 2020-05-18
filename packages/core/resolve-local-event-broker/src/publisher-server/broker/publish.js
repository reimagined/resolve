import { NOTIFICATION_EVENT_SYMBOL } from '../constants'

const publish = async (pool, event) => {
  const {
    pullNotificationsAsBatchForSubscriber,
    pushNotificationAndGetSubscriptions,
    multiplexAsync
  } = pool

  const subscriptionIds = await pushNotificationAndGetSubscriptions(
    pool,
    NOTIFICATION_EVENT_SYMBOL,
    event
  )

  for (const subscriptionId of subscriptionIds) {
    multiplexAsync(pullNotificationsAsBatchForSubscriber, pool, subscriptionId)
  }
}

export default publish
