import window from 'global/window'
import createSubscriptionAdapter, {
  SubscriptionAdapter,
} from './subscribe-adapter'
import { Context } from './context'
import { addCallback, removeCallback, rootCallback } from './subscribe-callback'
import { SubscriptionAdapterStatus } from './types'

interface SubscriptionKey {
  aggregateId: string
  eventType: string
}

type AggregateSelector = string[] | '*'

const REFRESH_TIMEOUT = 5000
const setTimeoutSafe =
  window && typeof window.setTimeout === 'function'
    ? window.setTimeout
    : setTimeout
const clearTimeoutSafe = (timeout: number | NodeJS.Timeout): void => {
  if (typeof timeout === 'number') {
    if (typeof window.clearTimeout === 'function') {
      window.clearTimeout(timeout)
    }
  } else {
    clearTimeout(timeout)
  }
}
const buildKey = (
  viewModelName: string,
  aggregateIds: AggregateSelector
): string => {
  const sortedAggregateIds = ([] as Array<string>)
    .concat(aggregateIds)
    .sort((a, b) => a.localeCompare(b))
  return [viewModelName].concat(sortedAggregateIds).join(':')
}

let adaptersMap = new Map<string, SubscriptionAdapter>()
let refreshTimeout: number | NodeJS.Timeout | null

export const getSubscriptionKeys = (
  context: Context,
  viewModelName: string,
  aggregateIds: Array<string> | '*'
): Array<SubscriptionKey> => {
  const { viewModels } = context
  const viewModel = viewModels.find(({ name }) => name === viewModelName)
  if (!viewModel) {
    return []
  }
  const eventTypes = Object.keys(viewModel.projection).filter(
    (eventType) => eventType !== 'Init'
  )
  return eventTypes.reduce((acc: Array<SubscriptionKey>, eventType) => {
    if (Array.isArray(aggregateIds)) {
      acc.push(
        ...aggregateIds.map((aggregateId) => ({ aggregateId, eventType }))
      )
    } else if (aggregateIds === '*') {
      acc.push({ aggregateId: '*', eventType })
    }
    return acc
  }, [])
}

export interface SubscribeAdapterOptions {
  appId: string
  url: string
}

const initSubscriptionAdapter = (
  url: string,
  cursor: string | null,
  context: Context,
  viewModelName: string,
  aggregateIds: AggregateSelector
): SubscriptionAdapter => {
  const subscription = createSubscriptionAdapter({
    url,
    cursor,
    onEvent: rootCallback,
  })
  subscription.init()

  if (!refreshTimeout) {
    refreshTimeout = setTimeoutSafe(
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      () =>
        refreshSubscriptionAdapter(
          url,
          cursor,
          context,
          viewModelName,
          aggregateIds,
          false
        ),
      REFRESH_TIMEOUT
    )
  }

  return subscription
}

export const refreshSubscriptionAdapter = async (
  url: string,
  cursor: string | null,
  context: Context,
  viewModelName: string,
  aggregateIds: AggregateSelector,
  subscriptionAdapterRecreated?: boolean
): Promise<any> => {
  let subscriptionAdapter

  const key = buildKey(viewModelName, aggregateIds)

  try {
    if (!adaptersMap.has(key)) {
      subscriptionAdapter = initSubscriptionAdapter(
        url,
        cursor,
        context,
        viewModelName,
        aggregateIds
      )
    } else {
      subscriptionAdapter = adaptersMap.get(key)
    }
  } catch (error) {
    adaptersMap.delete(key)
    if (refreshTimeout) {
      clearTimeoutSafe(refreshTimeout)
    }
    refreshTimeout = setTimeoutSafe(
      () =>
        refreshSubscriptionAdapter(
          url,
          cursor,
          context,
          viewModelName,
          aggregateIds,
          true
        ),
      REFRESH_TIMEOUT
    )
    return Promise.resolve()
  }

  if (!subscriptionAdapterRecreated) {
    try {
      if (
        subscriptionAdapter != null &&
        subscriptionAdapter.status() !== SubscriptionAdapterStatus.Closed
      ) {
        // still connected
        if (refreshTimeout) {
          clearTimeoutSafe(refreshTimeout)
        }
        refreshTimeout = setTimeoutSafe(
          () =>
            refreshSubscriptionAdapter(
              url,
              cursor,
              context,
              viewModelName,
              aggregateIds,
              false
            ),
          REFRESH_TIMEOUT
        )
        return Promise.resolve()
      }
    } catch (error) {}
  }

  // disconnected

  try {
    if (subscriptionAdapter != null) {
      adaptersMap.delete(key)
      if (refreshTimeout) {
        clearTimeoutSafe(refreshTimeout)
      }
      refreshTimeout = null
    }
  } catch (err) {}

  return Promise.resolve()
}

export const dropSubscribeAdapterPromise = (): void => {
  adaptersMap = new Map()
  if (refreshTimeout) {
    clearTimeoutSafe(refreshTimeout)
  }
  refreshTimeout = null
}

const connect = async (
  context: Context,
  url: string,
  cursor: string | null,
  aggregateIds: AggregateSelector,
  eventCallback: Function,
  viewModelName: string,
  subscribeCallback?: Function
): Promise<void> => {
  const subscriptionKeys = getSubscriptionKeys(
    context,
    viewModelName,
    aggregateIds
  )

  for (const { eventType, aggregateId } of subscriptionKeys) {
    addCallback(eventType, aggregateId, eventCallback, subscribeCallback)
  }

  const key = buildKey(viewModelName, aggregateIds)
  const cachedAdapter = adaptersMap.get(key)

  if (
    cachedAdapter != null &&
    cachedAdapter.status() !== SubscriptionAdapterStatus.Closed
  ) {
    return
  }

  const subscriptionAdapter = initSubscriptionAdapter(
    url,
    cursor,
    context,
    viewModelName,
    aggregateIds
  )

  if (subscriptionAdapter === null) {
    return
  }

  adaptersMap.set(key, subscriptionAdapter)
}

const disconnect = async (
  context: Context,
  aggregateIds: AggregateSelector,
  viewModelName: string,
  callback?: Function
): Promise<void> => {
  const subscriptionKeys = getSubscriptionKeys(
    context,
    viewModelName,
    aggregateIds
  )

  const key = buildKey(viewModelName, aggregateIds)
  const subscriptionAdapter = adaptersMap.get(key)

  if (subscriptionAdapter) {
    await subscriptionAdapter.close()
  }

  for (const { eventType, aggregateId } of subscriptionKeys) {
    removeCallback(eventType, aggregateId, callback)
  }
}

export { connect, disconnect }
