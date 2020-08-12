import window from 'global/window'
import createSubscribeAdapter from './subscribe-adapter'
import { Context } from './context'
import { rootCallback, addCallback, removeCallback } from './subscribe-callback'

interface SubscriptionKey {
  aggregateId: string
  eventType: string
}

interface Topic {
  topicId: string
  topicName: string
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

let adaptersMap = new Map()
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
    eventType => eventType !== 'Init'
  )
  return eventTypes.reduce((acc: Array<SubscriptionKey>, eventType) => {
    if (Array.isArray(aggregateIds)) {
      acc.push(...aggregateIds.map(aggregateId => ({ aggregateId, eventType })))
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

const initSubscribeAdapter = async (
  url: string,
  cursor: string,
  context: Context,
  viewModelName: string,
  topics: Array<Topic>,
  aggregateIds: AggregateSelector
): Promise<any> => {
  const subscribeAdapter = createSubscribeAdapter({
    url,
    cursor,
    onEvent: rootCallback
  })
  await subscribeAdapter.init()

  if (!refreshTimeout) {
    refreshTimeout = setTimeoutSafe(
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      () =>
        refreshSubscribeAdapter(
          url,
          cursor,
          context,
          viewModelName,
          topics,
          aggregateIds,
          false
        ),
      REFRESH_TIMEOUT
    )
  }

  return subscribeAdapter
}

export const refreshSubscribeAdapter = async (
  url: string,
  cursor: string,
  context: Context,
  viewModelName: string,
  topics: Array<Topic>,
  aggregateIds: AggregateSelector,
  subscribeAdapterRecreated?: boolean
): Promise<any> => {
  let subscribeAdapter

  const key = buildKey(viewModelName, aggregateIds)

  try {
    if (!adaptersMap.has(key)) {
      subscribeAdapter = await initSubscribeAdapter(
        url,
        cursor,
        context,
        viewModelName,
        topics,
        aggregateIds
      )
    } else {
      subscribeAdapter = adaptersMap.get(key)
    }
  } catch (error) {
    adaptersMap.delete(key)
    if (refreshTimeout) {
      clearTimeoutSafe(refreshTimeout)
    }
    refreshTimeout = setTimeoutSafe(
      () =>
        refreshSubscribeAdapter(
          url,
          cursor,
          context,
          viewModelName,
          topics,
          aggregateIds,
          true
        ),
      REFRESH_TIMEOUT
    )
    return Promise.resolve()
  }

  if (!subscribeAdapterRecreated) {
    try {
      if (subscribeAdapter.isConnected()) {
        // still connected
        if (refreshTimeout) {
          clearTimeoutSafe(refreshTimeout)
        }
        refreshTimeout = setTimeoutSafe(
          () =>
            refreshSubscribeAdapter(
              url,
              cursor,
              context,
              viewModelName,
              topics,
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
    if (subscribeAdapter != null) {
      await subscribeAdapter.close()
      adaptersMap.delete(key)
    }
    adaptersMap.set(
      key,
      await initSubscribeAdapter(
        url,
        cursor,
        context,
        viewModelName,
        topics,
        aggregateIds
      )
    )
  } catch (err) {}

  if (refreshTimeout) {
    clearTimeoutSafe(refreshTimeout)
  }
  refreshTimeout = setTimeoutSafe(
    () =>
      refreshSubscribeAdapter(
        url,
        cursor,
        context,
        viewModelName,
        topics,
        aggregateIds,
        false
      ),
    REFRESH_TIMEOUT
  )
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
  url: string,
  cursor: string,
  context: Context,
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

  const topics = subscriptionKeys.map(({ eventType, aggregateId }) => ({
    topicName: eventType,
    topicId: aggregateId
  }))

  const key = buildKey(viewModelName, aggregateIds)

  if (adaptersMap.has(key)) {
    return Promise.resolve()
  }

  const subscribeAdapter = await initSubscribeAdapter(
    url,
    cursor,
    context,
    viewModelName,
    topics,
    aggregateIds
  )

  if (subscribeAdapter === null) {
    return Promise.resolve()
  }

  adaptersMap.set(key, subscribeAdapter)

  for (const { eventType, aggregateId } of subscriptionKeys) {
    addCallback(eventType, aggregateId, eventCallback, subscribeCallback)
  }
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
  const subscribeAdapter = adaptersMap.get(key)

  await subscribeAdapter.close()

  adaptersMap.delete(key)

  for (const { eventType, aggregateId } of subscriptionKeys) {
    removeCallback(eventType, aggregateId, callback)
  }
}

export { connect, disconnect }
