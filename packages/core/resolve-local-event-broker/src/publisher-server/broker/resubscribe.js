import { RESUBSCRIBE_SYMBOL } from '../constants'

const resubscribe = async (pool, eventSubscriber, subscriptionOptions) => {
  return await pool.ensureOrResetSubscription(
    pool,
    RESUBSCRIBE_SYMBOL,
    eventSubscriber,
    subscriptionOptions
  )
}

export default resubscribe
