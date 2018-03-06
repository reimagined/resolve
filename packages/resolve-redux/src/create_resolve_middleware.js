import {
  SUBSCRIBE,
  UNSUBSCRIBE,
  SEND_COMMAND,
  SUBSCRIBE_READMODEL,
  UNSUBSCRIBE_READMODEL
} from './action_types'
import actions from './actions'
import defaultSubscribeAdapter from './subscribe_adapter'
import sendCommand from './send_command'
import loadInitialState from './load_initial_state'
import { getKey, getRootableUrl, delay } from './util'

const REFRESH_TIMEOUT = 1000

export function getEventTypes(viewModels, subscribers) {
  const eventTypes = {}

  Object.keys(subscribers.viewModels).forEach(viewModelName => {
    if (!subscribers.viewModels[viewModelName]) {
      return
    }

    const { Init, ...projection } = viewModels.find(({ name }) => name === viewModelName).projection

    Object.keys(projection).forEach(eventType => {
      eventTypes[eventType] = true
    })
  })

  return Object.keys(eventTypes)
}

export function getAggregateIds(viewModels, subscribers) {
  if (subscribers.aggregateIds['*'] > 0) {
    return '*'
  }

  return Object.keys(subscribers.aggregateIds).filter(
    aggregateId => subscribers.aggregateIds[aggregateId]
  )
}

export async function subscribe(
  store,
  subscribeAdapter,
  viewModels,
  subscribers,
  requests,
  action
) {
  const { viewModelName, aggregateId } = action

  const needChange =
    !subscribers.viewModels[viewModelName] || !subscribers.aggregateIds[aggregateId]

  subscribers.viewModels[viewModelName] = (subscribers.viewModels[viewModelName] || 0) + 1
  subscribers.aggregateIds[aggregateId] = (subscribers.aggregateIds[aggregateId] || 0) + 1

  if (needChange) {
    const key = getKey(viewModelName, aggregateId)
    requests[key] = true

    const rawState = await loadInitialState(viewModelName, aggregateId)

    const state = viewModels.find(({ name }) => name === viewModelName).deserializeState(rawState)

    if (requests[key]) {
      delete requests[key]

      store.dispatch(actions.merge(viewModelName, aggregateId, state))

      subscribeAdapter.setSubscription({
        types: getEventTypes(viewModels, subscribers),
        aggregateIds: getAggregateIds(viewModels, subscribers)
      })
    }
  }
}

export function unsubscribe(store, subscribeAdapter, viewModels, subscribers, requests, action) {
  const { viewModelName, aggregateId } = action

  subscribers.viewModels[viewModelName] = Math.max(
    (subscribers.viewModels[viewModelName] || 0) - 1,
    0
  )
  subscribers.aggregateIds[aggregateId] = Math.max(
    (subscribers.aggregateIds[aggregateId] || 0) - 1,
    0
  )

  const needChange =
    !subscribers.viewModels[viewModelName] || !subscribers.aggregateIds[aggregateId]

  const key = getKey(viewModelName, aggregateId)
  delete requests[key]

  if (needChange) {
    subscribeAdapter.setSubscription({
      types: getEventTypes(viewModels, subscribers),
      aggregateIds: getAggregateIds(viewModels, subscribers)
    })
  }
}

export function subscribeReadmodel(store, readModelSubscriptions, subscribeAdapter, action) {
  const { readModelName, resolverName, query, variables, isReactive = true } = action
  const subscriptionKey = `${readModelName}:${resolverName}`
  if (readModelSubscriptions.hasOwnProperty(subscriptionKey)) return

  const fetchReadModel = () => {
    const checkSelfPromise = selfPromise => {
      return (
        readModelSubscriptions.hasOwnProperty(subscriptionKey) &&
        selfPromise === readModelSubscriptions[subscriptionKey].promise
      )
    }

    const selfPromise = Promise.resolve().then(async () => {
      try {
        if (!checkSelfPromise(selfPromise)) return
        const socketId = await subscribeAdapter.getClientId()
        readModelSubscriptions[subscriptionKey].socketId = socketId

        if (!checkSelfPromise(selfPromise)) return
        const response = await fetch(getRootableUrl(`/api/createSubscription/${readModelName}`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            resolverName,
            query,
            variables,
            isReactive,
            socketId
          })
        })
        if (!response.ok) throw new Error()
        const { result, timeToLive } = await response.json()

        if (!checkSelfPromise(selfPromise)) return
        store.dispatch(actions.loadReadmodelInitialState(readModelName, resolverName, result))

        await delay(timeToLive)
        fetchReadModel()
      } catch (error) {
        await delay(1000)
        fetchReadModel()
      }
    })

    readModelSubscriptions[subscriptionKey].promise = selfPromise
  }

  readModelSubscriptions[subscriptionKey] = {
    promise: Promise.resolve(),
    refresh: fetchReadModel,
    socketId: null
  }

  fetchReadModel()
}

export function unsubscribeReadmodel(store, readModelSubscriptions, action) {
  const { readModelName, resolverName } = action
  const subscriptionKey = `${readModelName}:${resolverName}`
  if (!readModelSubscriptions.hasOwnProperty(subscriptionKey)) return

  const socketId = readModelSubscriptions[subscriptionKey].socketId
  delete readModelSubscriptions[subscriptionKey]

  store.dispatch(actions.loadReadmodelInitialState(readModelName, resolverName))

  if (!socketId || socketId.constructor !== String) return

  fetch(getRootableUrl(`/api/removeSubscription/${readModelName}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      resolverName,
      socketId
    })
  }).catch(error => null)
}

const isClient = typeof window !== 'undefined'

export const mockSubscribeAdapter = {
  onEvent() {},
  onDisconnect() {},
  setSubscription() {},
  getClientId() {
    return Promise.resolve('0')
  }
}

export function createResolveMiddleware({
  viewModels = [],
  subscribeAdapter = defaultSubscribeAdapter
}) {
  const subscribers = {
    viewModels: {},
    aggregateIds: {}
  }

  const requests = {}
  const loading = viewModels.reduce((acc, { name }) => {
    acc[name] = {}
    return acc
  }, {})

  const readModelSubscriptions = {}

  return store => {
    Object.defineProperty(store.getState, 'isLoadingViewModel', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: (viewModelName, aggregateId) => !!loading[viewModelName][aggregateId]
    })

    store.dispatch(actions.provideViewModels(viewModels))

    const adapter = isClient ? subscribeAdapter() : mockSubscribeAdapter
    adapter.onEvent(event => store.dispatch(event))
    adapter.onDisconnect(error => {
      store.dispatch(actions.disconnect(error))

      Object.keys(readModelSubscriptions).forEach(subscriptionKey => {
        readModelSubscriptions[subscriptionKey].refresh()
      })
    })

    return next => action => {
      switch (action.type) {
        case SUBSCRIBE: {
          const { viewModelName, aggregateId } = action
          loading[viewModelName][aggregateId] = true

          if (isClient) {
            subscribe(store, adapter, viewModels, subscribers, requests, action).catch(error =>
              setTimeout(() => {
                // eslint-disable-next-line no-console
                console.error(error)
                store.dispatch(action)
              }, REFRESH_TIMEOUT)
            )
          }

          break
        }
        case UNSUBSCRIBE: {
          const { viewModelName, aggregateId } = action
          delete loading[viewModelName][aggregateId]

          if (isClient) {
            unsubscribe(store, adapter, viewModels, subscribers, requests, action)
          }

          break
        }
        case SUBSCRIBE_READMODEL: {
          if (isClient) {
            subscribeReadmodel(store, readModelSubscriptions, adapter, action)
          }

          break
        }
        case UNSUBSCRIBE_READMODEL: {
          if (isClient) {
            unsubscribeReadmodel(store, readModelSubscriptions, action)
          }

          break
        }
        case SEND_COMMAND: {
          if (isClient) {
            sendCommand(store, action)
          }

          break
        }
        default:
      }

      return next(action)
    }
  }
}

export default createResolveMiddleware
