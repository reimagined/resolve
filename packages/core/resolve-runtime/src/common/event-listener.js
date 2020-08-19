import { OMIT_BATCH } from 'resolve-readmodel-base'

const serializeEventApplyError = (error) => ({
  name: error.name != null ? String(error.name) : error.name,
  code: String(error.code),
  message: String(error.message),
  stack: String(error.stack)
})

const serializeEventApplyResult = (result) => {
  const baseResult = { successEvent: null, failedEvent: null }
  if(result == null || result.constructor !== Object) {
    const errorMessage = `Result is unknown entity ${JSON.stringify(result)}` 
    return {  ...baseResult, error: { message: errorMessage } }
  } else if(result.constructor === Error) {
    const error = serializeEventApplyError(result)
    return {  ...baseResult, error }
  } else if (result.error != null && result.error.constructor === Error) {
    const error = serializeEventApplyError(result.error)
    return { ...result, error }
  }
}

const sendEvents = async (
  resolve,
  {
    eventSubscriber,
    batchId,
    xaTransactionId,
    properties,
    events
  }
) => {
  let result = null
  if (batchId == null && eventSubscriber === 'websocket') {
    for (const event of events) {
      await resolve.sendReactiveEvent(event)
    }
    return
  }

  const listenerInfo = resolve.eventListeners.get(eventSubscriber)
  if (listenerInfo == null) {
    throw new Error(`Listener ${eventSubscriber} does not exist`)
  }

  const updateByEvents = listenerInfo.isSaga
    ? resolve.executeSaga.updateByEvents
    : resolve.executeQuery.updateByEvents

  try {
    result = await updateByEvents({
      modelName: eventSubscriber,
      getRemainingTimeInMillis: resolve.getRemainingTimeInMillis,
      events,
      properties,
      xaTransactionId
    })
  } catch (error) {
    result = error
  }

  if (result != null && result.error === OMIT_BATCH) {
    return
  }

  const serializedResult = serializeEventApplyResult(result)

  await resolve.publisher.acknowledge({
    result: serializedResult,
    batchId
  })
}

const performListenerOperation = async (
  resolve,
  operationName,
  { eventSubscriber, ...parameters }
) => {
  const listenerInfo = resolve.eventListeners.get(eventSubscriber)
  if (listenerInfo == null) {
    throw new Error(`Listener ${eventSubscriber} does not exist`)
  }
  const method = listenerInfo.isSaga
    ? resolve.executeSaga[operationName]
    : resolve.executeQuery[operationName]

  const result = await method({
    modelName: eventSubscriber,
    ...parameters
  })

  return result
}

const createEventListener = (resolve) => {
  const eventListener = new Proxy({}, {
    get(_, key) {
      if(key === 'sendEvents') {
        return sendEvents.bind(null, resolve)
      } else {
        return performListenerOperation.bind(null, resolve, key)
      }
    },
    set() {
      throw new Error(`Event listener API is immutable`)
    }
  })

  return eventListener
}

export default createEventListener
