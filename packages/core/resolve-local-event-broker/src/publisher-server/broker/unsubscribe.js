import { UNSUBSCRIBE_SYMBOL } from '../constants'

const unsubscribe = async (pool, eventSubscriber) => {
  return await pool.ensureOrResetSubscription(
    pool,
    UNSUBSCRIBE_SYMBOL,
    eventSubscriber
  )
}

export default unsubscribe
