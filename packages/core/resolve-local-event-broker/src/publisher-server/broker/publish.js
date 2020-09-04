import {
  LazinessStrategy,
  ConsumerMethod,
  PrivateOperationType,
} from '../constants'

const publish = async (pool, payload) => {
  const { invokeOperation, invokeConsumer } = pool
  const { event } = payload

  await invokeConsumer(pool, ConsumerMethod.SaveEvent, {
    event,
  })

  const input = {
    type: PrivateOperationType.PUSH_NOTIFICATIONS,
    payload: {
      event,
    },
  }
  await invokeOperation(pool, LazinessStrategy.EAGER, input)
}

export default publish
