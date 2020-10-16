interface CallbackTuple extends Array<Function | undefined> {
  0: Function
  1: Function | undefined
}

let callbackMap: {
  [key: string]: {
    [key: string]: Array<CallbackTuple>
  }
} = {}

const addCallback = (
  eventType: string,
  aggregateId: string,
  eventCallback: Function,
  resubscribeCallback?: Function
): void => {
  if (!callbackMap[eventType]) {
    callbackMap[eventType] = {}
  }
  if (!callbackMap[eventType][aggregateId]) {
    callbackMap[eventType][aggregateId] = []
  }
  callbackMap[eventType][aggregateId].push([eventCallback, resubscribeCallback])
}

const removeCallback = (
  eventType: string,
  aggregateId: string,
  eventCallback?: Function
): void => {
  callbackMap[eventType][aggregateId] = callbackMap[eventType][
    aggregateId
  ].filter((f) => f[0] !== eventCallback)
}

const rootCallback = (
  event: {
    aggregateId: string
    type: string
  },
  resubscribed?: boolean
): void => {
  const { type, aggregateId } = event
  for (const eventType in callbackMap) {
    if (eventType === type) {
      let listeners: Array<CallbackTuple> = []
      const wildcard = callbackMap[eventType]['*'] ?? []
      let aggregateIdListeners: Array<CallbackTuple> = []
      if (aggregateId !== '*') {
        aggregateIdListeners = callbackMap[eventType][aggregateId] ?? []
      }
      listeners = listeners.concat(wildcard).concat(aggregateIdListeners)
      if (listeners) {
        if (resubscribed) {
          listeners.forEach(
            (listener) => listener[1] && listener[1]({ eventType, aggregateId })
          )
        } else {
          listeners.forEach((listener) => listener[0](event))
        }
      }
    }
  }
}

const dropCallbackMap = (): void => {
  callbackMap = {}
}

export { rootCallback, addCallback, removeCallback, dropCallbackMap }
