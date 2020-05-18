import { PAUSE_SYMBOL } from '../constants'

const pause = async (pool, eventSubscriber) => {
  return await pool.manageSubscription(pool, PAUSE_SYMBOL, eventSubscriber)
}

export default pause
