type ViewModelListener = {
  onEvent: Function
  onResubscribe?: Function
}

type ReadModelListener = {
  onNotification: Function
}

type ViewModelKey = {
  eventType: string
  aggregateId: string
}

type ReadModelKey = {
  readModelName: string
  channel: string
}

let viewModelCallbacks: {
  [key: string]: {
    [key: string]: ViewModelListener[]
  }
} = {}

let readModelCallbacks: {
  [key: string]: {
    [key: string]: ReadModelListener[]
  }
} = {}

const isViewModelKey = (key: any): key is ViewModelKey => key.eventType != null
const isViewModelListener = (listener: any): listener is ViewModelListener =>
  typeof listener.onEvent === 'function'
const isReadModelListener = (listener: any): listener is ReadModelListener =>
  typeof listener.onNotification === 'function'

export const addCallback = (
  key: ViewModelKey | ReadModelKey,
  listener: ViewModelListener | ReadModelListener
): void => {
  if (isViewModelKey(key)) {
    const { eventType, aggregateId } = key
    if (isViewModelListener(listener)) {
      if (!viewModelCallbacks[eventType]) {
        viewModelCallbacks[eventType] = {}
      }
      if (!viewModelCallbacks[eventType][aggregateId]) {
        viewModelCallbacks[eventType][aggregateId] = []
      }
      viewModelCallbacks[eventType][aggregateId].push(listener)
    } else {
      throw Error('Invalid WS callback listener')
    }
  } else {
    const { channel, readModelName } = key
    if (isReadModelListener(listener)) {
      if (!readModelCallbacks[readModelName]) {
        readModelCallbacks[readModelName] = {}
      }
      if (!readModelCallbacks[readModelName][channel]) {
        readModelCallbacks[readModelName][channel] = []
      }
      readModelCallbacks[readModelName][channel].push(listener)
    } else {
      throw Error('Invalid WS callback listener')
    }
  }
}

export const removeCallback = (
  key: ViewModelKey | ReadModelKey,
  listener: ViewModelListener | ReadModelListener
): void => {
  if (isViewModelKey(key) && isViewModelListener(listener)) {
    const { eventType, aggregateId } = key
    const callbacks = viewModelCallbacks[eventType][aggregateId]
    viewModelCallbacks[eventType][aggregateId] = callbacks.filter(
      (f) => f.onEvent !== listener.onEvent
    )
  }
  if (!isViewModelKey(key) && isReadModelListener(listener)) {
    const { channel, readModelName } = key
    const callbacks = readModelCallbacks[readModelName][channel]
    readModelCallbacks[readModelName][channel] = callbacks.filter(
      (f) => f.onNotification !== listener.onNotification
    )
  }
}

export const viewModelCallback = (
  event: {
    aggregateId: string
    type: string
  },
  resubscribed?: boolean
): void => {
  const { type, aggregateId } = event
  for (const eventType in viewModelCallbacks) {
    if (eventType === type) {
      let listeners: Array<ViewModelListener> = []
      const wildcard = viewModelCallbacks[eventType]['*'] ?? []
      let aggregateIdListeners: Array<ViewModelListener> = []
      if (aggregateId !== '*') {
        aggregateIdListeners = viewModelCallbacks[eventType][aggregateId] ?? []
      }
      listeners = listeners.concat(wildcard).concat(aggregateIdListeners)
      if (listeners) {
        if (resubscribed) {
          listeners.forEach(
            (listener) =>
              listener.onResubscribe &&
              listener.onResubscribe({ eventType, aggregateId })
          )
        } else {
          listeners.forEach((listener) => listener.onEvent(event))
        }
      }
    }
  }
}

export const readModelCallback = (event: {
  readModelName: string
  channel: string
  notification: any
}): void => {
  const { readModelName, channel, notification } = event
  const callbacks = readModelCallbacks[readModelName]?.[channel]
  if (Array.isArray(callbacks)) {
    callbacks.forEach((listener) => listener.onNotification(notification))
  }
}

export const dropCallbackMap = (): void => {
  viewModelCallbacks = {}
  readModelCallbacks = {}
}
