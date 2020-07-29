import { ConsumerMethod } from '../constants'

const consumerMethodsMap = new Map([
  [ConsumerMethod.BeginXATransaction, 'beginXATransaction'],
  [ConsumerMethod.CommitXATransaction, 'commitXATransaction'],
  [ConsumerMethod.RollbackXATransaction, 'rollbackXATransaction'],
  [ConsumerMethod.SendCursor, 'sendCursor'],
  [ConsumerMethod.SendEvents, 'sendEvents'],
  [ConsumerMethod.LoadEvents, 'loadEvents'],
  [ConsumerMethod.SaveEvent, 'saveEvent'],
  [ConsumerMethod.Drop, 'drop']
])

const invokeConsumer = async (pool, method, payload, isAsync) => {
  const { consumer, multiplexAsync } = pool
  const methodName = consumerMethodsMap.get(method)
  if (methodName == null) {
    throw new Error(
      `Invalid invoke consumer method "${method}" with payload: ${JSON.stringify(
        payload
      )}`
    )
  } else if (isAsync) {
    return await multiplexAsync(consumer[methodName].bind(consumer), payload)
  } else {
    return await consumer[methodName](payload)
  }
}

export default invokeConsumer
