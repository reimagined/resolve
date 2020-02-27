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
  topicName: string,
  topicId: string,
  eventCallback: Function,
  resubscribeCallback?: Function
): void => {
  if (!callbackMap[topicName]) {
    callbackMap[topicName] = {}
  }
  if (!callbackMap[topicName][topicId]) {
    callbackMap[topicName][topicId] = []
  }
  callbackMap[topicName][topicId].push([eventCallback, resubscribeCallback])
}

const removeCallback = (
  topicName: string,
  topicId: string,
  eventCallback?: Function
): void => {
  callbackMap[topicName][topicId] = callbackMap[topicName][topicId].filter(
    f => f[0] !== eventCallback
  )
}

const rootCallback = (event: any, resubscribed?: boolean): void => {
  const { type: eventTopic, aggregateId } = event
  for (const topicName in callbackMap) {
    if (topicName === eventTopic) {
      let listeners: Array<CallbackTuple> = []
      const wildcard = callbackMap[topicName]['*'] ?? []
      let aggregateIdListeners: Array<CallbackTuple> = []
      if (aggregateId !== '*') {
        aggregateIdListeners = callbackMap[topicName][aggregateId] ?? []
      }
      listeners = listeners.concat(wildcard).concat(aggregateIdListeners)
      if (listeners) {
        if (resubscribed) {
          listeners.forEach(
            listener => listener[1] && listener[1]({ eventTopic, aggregateId })
          )
        } else {
          listeners.forEach(listener => listener[0](event))
        }
      }
    }
  }
}

const dropCallbackMap = (): void => {
  callbackMap = {}
}

export { rootCallback, addCallback, removeCallback, dropCallbackMap }
