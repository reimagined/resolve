const eventSubscriberMethod = async (resolve, key, ...args) => {
  if (args.length !== 1 || Object(args[0]) !== args[0]) {
    throw new TypeError(
      `Invalid EventSubscriber method "${key}" arguments ${JSON.stringify(
        args
      )}`
    )
  }

  let { eventSubscriber, modelName, ...parameters } = args[0]
  if (eventSubscriber == null && modelName == null) {
    throw new Error(`Either "eventSubscriber" nor "modelName" is null`)
  } else if (eventSubscriber == null) {
    eventSubscriber = modelName
  } else {
    modelName = eventSubscriber
  }

  const listenerInfo = resolve.eventListeners.get(eventSubscriber)
  if (listenerInfo == null) {
    throw new Error(`Listener ${eventSubscriber} does not exist`)
  }

  const method = listenerInfo.isSaga
    ? resolve.executeSaga[key]
    : resolve.executeQuery[key]

  if (typeof method != 'function') {
    throw new TypeError(key)
  }

  const result = await method({ modelName, ...parameters })

  return result
}

const createEventSubscriber = (resolve) => {
  const eventSubscriber = new Proxy(
    {},
    {
      get(_, key) {
        return eventSubscriberMethod.bind(null, resolve, key)
      },
      set() {
        throw new Error(`Event subscriber API is immutable`)
      },
    }
  )

  return eventSubscriber
}

export default createEventSubscriber
