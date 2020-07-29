import {
  LazinessStrategy,
  ConsumerMethod,
  PrivateOperationType
} from '../constants'

const publish = async (pool, payload) => {
  const { invokeOperation, invokeConsumer } = pool
  const { event } = payload

  await invokeConsumer(pool, ConsumerMethod.SaveEvent, {
    event
  })

  const eventPayloadSize = JSON.stringify(
    event.payload != null ? event.payload : null
  ).length

  const input = {
    type: PrivateOperationType.PUSH_NOTIFICATIONS,
    payload: {
      event: {
        threadId: event.threadId,
        threadCounter: event.threadCounter,
        aggregateId: event.aggregateId,
        aggregateVersion: event.aggregateVersion,
        type: event.type,
        payload: eventPayloadSize < 8000 ? event.payload : null
      }
    }
  }

  // TODO: restore view-model reactivity for fat events
  void (input.payload.stripEvent = eventPayloadSize >= 8000)

  await invokeOperation(pool, LazinessStrategy.EAGER, input)
}

export default publish
