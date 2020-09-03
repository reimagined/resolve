const performListenerOperation = async (
  resolve,
  operationName,
  { eventSubscriber, ...parameters }
) => {
  // TODO improve reactivity
  if (
    operationName === 'sendEvents' &&
    eventSubscriber === 'websocket' &&
    parameters.batchId == null &&
    Array.isArray(parameters.events)
  ) {
    for (const event of parameters.events) {
      await resolve.sendReactiveEvent(event)
    }
    return
  }

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

const createEventListener = resolve => {
  const eventListener = new Proxy(
    {},
    {
      get(_, key) {
        return performListenerOperation.bind(
          null,
          resolve,
          key[0].toLowerCase() + key.slice(1)
        )
      },
      set() {
        throw new Error(`Event listener API is immutable`)
      }
    }
  )

  return eventListener
}

export default createEventListener
