import { SUBSCRIBE_SYMBOL } from '../constants'

const subscribe = async (pool, eventSubscriber, subscriptionOptions) => {
  return await pool.ensureOrResetSubscription(
    pool,
    SUBSCRIBE_SYMBOL,
    eventSubscriber,
    subscriptionOptions
  )
}

export default subscribe
