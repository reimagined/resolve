import { RESUME_SYMBOL } from '../constants'

const resume = async (pool, eventSubscriber) => {
  return await pool.manageSubscription(pool, RESUME_SYMBOL, eventSubscriber)
}

export default resume
