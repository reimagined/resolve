import { SUBSCRIBER_OPTIONS_FETCH_SYMBOL } from '../constants'

const status = async (pool, eventSubscriber) => {
  return await pool.getSubscriberOptions(
    pool,
    SUBSCRIBER_OPTIONS_FETCH_SYMBOL,
    eventSubscriber,
    ['successEvent', 'failedEvent', 'errors', 'status']
  )
}

export default status
