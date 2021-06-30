import window from 'global/window'
import {
  createSubscriptionAdapter,
  SubscriptionAdapter,
} from './subscribe-adapter'
import { Context } from './context'
import {
  addCallback,
  readModelCallback,
  removeCallback,
  viewModelCallback,
} from './subscribe-callback'
import { SubscriptionAdapterStatus } from './types'
import {
  AggregateSelector,
  ReadModelSubscription,
  ReadModelSubscriptionParams,
  SubscriptionHandler,
  SubscriptionKind,
  ViewModelSubscription,
  ViewModelSubscriptionParams,
} from './client'
import { isViewModelSubscriptionParams } from './utils'

interface SubscriptionKey {
  aggregateId: string
  eventType: string
}

const REFRESH_TIMEOUT = 5000
const setTimeoutSafe = (callback: Function, timeout: number): any =>
  window && typeof window.setTimeout === 'function'
    ? window.setTimeout(callback, timeout)
    : setTimeout(callback, timeout)

const clearTimeoutSafe = (timeout: number | NodeJS.Timeout): void => {
  if (typeof timeout === 'number') {
    if (typeof window.clearTimeout === 'function') {
      window.clearTimeout(timeout)
    }
  } else {
    clearTimeout(timeout)
  }
}

type ViewModelKey = {
  viewModelName: string
  aggregateIds: AggregateSelector
}
type ReadModelKey = {
  readModelName: string
  channel: string
}

const isViewModelKey = (key: any): key is ViewModelKey =>
  key.viewModelName != null

const buildKey = (key: ViewModelKey | ReadModelKey): string => {
  if (isViewModelKey(key)) {
    const { viewModelName, aggregateIds } = key
    const sortedAggregateIds = ([] as Array<string>)
      .concat(aggregateIds)
      .sort((a, b) => a.localeCompare(b))
    return ['vm', viewModelName].concat(sortedAggregateIds).join(':')
  } else {
    const { readModelName, channel } = key
    return `rm:${readModelName}:${channel}`
  }
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
  context: Context,
  params: ViewModelSubscriptionParams | ReadModelSubscriptionParams
): SubscriptionAdapter => {
  const callback = isViewModelSubscriptionParams(params)
    ? viewModelCallback
    : readModelCallback
  const adapter = createSubscriptionAdapter(params, callback)

  adapter.init()

  if (!refreshTimeout) {
    refreshTimeout = setTimeoutSafe(
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      () => refreshSubscriptionAdapter(context, params, false),
      REFRESH_TIMEOUT
    )
  }
  return adapter
}

export const refreshSubscriptionAdapter = async (
  context: Context,
  params: ViewModelSubscriptionParams | ReadModelSubscriptionParams,
  subscriptionAdapterRecreated?: boolean
): Promise<any> => {
  let subscriptionAdapter

  const key = buildKey(params)

  try {
    if (!adaptersMap.has(key)) {
      subscriptionAdapter = initSubscriptionAdapter(context, params)
    } else {
      subscriptionAdapter = adaptersMap.get(key)
    }
  } catch (error) {
    adaptersMap.delete(key)
    if (refreshTimeout) {
      clearTimeoutSafe(refreshTimeout)
    }
    refreshTimeout = setTimeoutSafe(
      () => refreshSubscriptionAdapter(context, params, true),
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
          () => refreshSubscriptionAdapter(context, params, false),
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

export const connect = async (
  context: Context,
  params: ViewModelSubscriptionParams | ReadModelSubscriptionParams,
  handler: SubscriptionHandler,
  subscribeCallback?: Function
): Promise<ReadModelSubscription | ViewModelSubscription> => {
  if (isViewModelSubscriptionParams(params)) {
    const { viewModelName, aggregateIds } = params

    const subscriptionKeys = getSubscriptionKeys(
      context,
      viewModelName,
      aggregateIds
    )

    for (const { eventType, aggregateId } of subscriptionKeys) {
      addCallback(
        { eventType, aggregateId },
        { onEvent: handler, onResubscribe: subscribeCallback }
      )
    }

    const key = buildKey(params)
    const cachedAdapter = adaptersMap.get(key)

    if (
      cachedAdapter == null ||
      cachedAdapter.status() === SubscriptionAdapterStatus.Closed
    ) {
      const subscriptionAdapter = initSubscriptionAdapter(context, params)
      adaptersMap.set(key, subscriptionAdapter)
    }

    return {
      kind: SubscriptionKind.viewModel,
      viewModelName,
      aggregateIds,
      handler,
    }
  } else {
    const { readModelName, channel } = params

    addCallback({ readModelName, channel }, { onNotification: handler })

    const key = buildKey(params)
    const cachedAdapter = adaptersMap.get(key)

    if (
      cachedAdapter == null ||
      cachedAdapter.status() === SubscriptionAdapterStatus.Closed
    ) {
      const subscriptionAdapter = initSubscriptionAdapter(context, params)
      adaptersMap.set(key, subscriptionAdapter)
    }

    return {
      kind: SubscriptionKind.readModel,
      readModelName,
      channel,
      handler,
    }
  }
}

export const disconnect = async (
  context: Context,
  subscription: ViewModelSubscription | ReadModelSubscription
): Promise<void> => {
  if (subscription.kind === SubscriptionKind.viewModel) {
    const { viewModelName, aggregateIds, handler } = subscription
    const subscriptionKeys = getSubscriptionKeys(
      context,
      viewModelName,
      aggregateIds
    )

    const key = buildKey(subscription)
    const subscriptionAdapter = adaptersMap.get(key)

    if (subscriptionAdapter) {
      await subscriptionAdapter.close()
    }

    for (const { eventType, aggregateId } of subscriptionKeys) {
      removeCallback({ eventType, aggregateId }, { onEvent: handler })
    }
  }
}
