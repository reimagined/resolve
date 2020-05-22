import { ConsumerMethod } from '../constants'

const read = async (pool, payload) => {
  const { invokeConsumer } = pool
  const { eventFilter } = payload
  const result = await invokeConsumer(
    pool,
    ConsumerMethod.LoadEvents,
    eventFilter
  )
  return result
}

export default read
