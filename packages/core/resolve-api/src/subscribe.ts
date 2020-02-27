import createConnectionManager from './create_connection_manager'
import createEmptySubscribeAdapter from './empty_subscribe_adapter'
import { Context } from './context'
import {
  rootCallback,
  addCallback,
  removeCallback
} from './view_model_subscribe_callback'
import determineOrigin from './determine_origin'
import { GenericError } from './errors'
import { request } from './request'

interface SubscriptionKey {
  aggregateId: string
  eventType: string
}

const REFRESH_TIMEOUT = 5000

let refreshTimeout: number | null
let subscribeAdapterPromise: Promise<any> | null = null

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

export const getSubscribeAdapterOptions = async (
  context: Context,
  adapterName: string
): Promise<SubscribeAdapterOptions> => {
  const { rootPath, origin: customOrigin } = context
  const origin = determineOrigin(customOrigin)

  const response = await request(context, '/api/subscribe', {
    origin,
    rootPath,
    adapterName
  })

  try {
    return await response.json()
  } catch (error) {
    throw new GenericError(error)
  }
}

const initSubscribeAdapter = async (context: Context): Promise<any> => {
  const { subscribeAdapter: createSubscribeAdapter } = context
  if (createSubscribeAdapter === createEmptySubscribeAdapter) {
    return createEmptySubscribeAdapter()
  }
  if (!createSubscribeAdapter) {
    return Promise.resolve()
  }
  const { appId, url } = await getSubscribeAdapterOptions(
    context,
    createSubscribeAdapter.adapterName
  )
  const { origin: customOrigin, rootPath } = context

  const origin = determineOrigin(customOrigin)

  const subscribeAdapter = createSubscribeAdapter({
    appId,
    origin,
    rootPath,
    url,
    onEvent: rootCallback
  })
  await subscribeAdapter.init()

  if (!refreshTimeout) {
    refreshTimeout = setTimeout(
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      () => refreshSubscribeAdapter(context),
      REFRESH_TIMEOUT
    )
  }

  return subscribeAdapter
}

const getSubscribeAdapterPromise = (context: Context): Promise<any> => {
  if (subscribeAdapterPromise !== null) {
    return subscribeAdapterPromise
  }
  subscribeAdapterPromise = initSubscribeAdapter(context)
  return subscribeAdapterPromise
}

export const refreshSubscribeAdapter = async (
  context: Context,
  subscribeAdapterRecreated?: boolean
): Promise<any> => {
  let subscribeAdapter
  try {
    subscribeAdapter = await getSubscribeAdapterPromise(context)
  } catch (error) {
    subscribeAdapterPromise = null
    if (refreshTimeout) {
      clearTimeout(refreshTimeout)
    }
    refreshTimeout = setTimeout(
      () => refreshSubscribeAdapter(context, true),
      REFRESH_TIMEOUT
    )
    return Promise.resolve()
  }

  if (!subscribeAdapterRecreated) {
    try {
      if (subscribeAdapter.isConnected()) {
        // still connected
        if (refreshTimeout) {
          clearTimeout(refreshTimeout)
        }
        refreshTimeout = setTimeout(
          () => refreshSubscribeAdapter(context),
          REFRESH_TIMEOUT
        )
        return Promise.resolve()
      }
    } catch (error) {}
  }

  const connectionManager = createConnectionManager()
  const activeConnections = connectionManager.getConnections()

  // disconnected

  try {
    if (subscribeAdapter != null) {
      await subscribeAdapter.close()
    }
    subscribeAdapterPromise = null
    subscribeAdapter = await getSubscribeAdapterPromise(context)

    subscribeAdapter.subscribeToTopics(
      activeConnections.map(({ connectionName, connectionId }) => ({
        topicName: connectionName,
        topicId: connectionId
      }))
    )

    for (const connection of activeConnections) {
      const { connectionName, connectionId } = connection
      rootCallback({ type: connectionName, aggregateId: connectionId }, true)
    }
  } catch (err) {}

  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
  }
  refreshTimeout = setTimeout(
    () => refreshSubscribeAdapter(context),
    REFRESH_TIMEOUT
  )
  return Promise.resolve()
}

export const dropSubscribeAdapterPromise = (): void => {
  subscribeAdapterPromise = null
  const connectionManager = createConnectionManager()
  connectionManager.destroy()
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
  }
  refreshTimeout = null
}

const doSubscribe = async (
  context: Context,
  {
    topicName,
    topicId
  }: {
    topicName: string
    topicId: string
  },
  eventCallback: Function,
  subscribeCallback?: Function
): Promise<object> => {
  const connectionManager = createConnectionManager()
  const subscribeAdapter = await getSubscribeAdapterPromise(context)
  if (subscribeAdapter === null) {
    return Promise.resolve({})
  }
  const {
    addedConnections,
    removedConnections
  } = connectionManager.addConnection({
    connectionName: topicName,
    connectionId: topicId
  })

  addCallback(topicName, topicId, eventCallback, subscribeCallback)
  await Promise.all([
    addedConnections.length > 0
      ? subscribeAdapter.subscribeToTopics(
          addedConnections.map(({ connectionName, connectionId }) => ({
            topicName: connectionName,
            topicId: connectionId
          }))
        )
      : Promise.resolve(),
    removedConnections.length > 0
      ? subscribeAdapter.unsubscribeFromTopics(
          removedConnections.map(({ connectionName, connectionId }) => ({
            topicName: connectionName,
            topicId: connectionId
          }))
        )
      : Promise.resolve()
  ])

  return { topicName, topicId }
}

const doUnsubscribe = async (
  context: Context,
  {
    topicName,
    topicId
  }: {
    topicName: string
    topicId: string
  },
  callback?: Function
): Promise<object> => {
  const connectionManager = createConnectionManager()
  const subscribeAdapter = await getSubscribeAdapterPromise(context)
  if (subscribeAdapter === null) {
    return Promise.resolve({})
  }

  const {
    addedConnections,
    removedConnections
  } = connectionManager.removeConnection({
    connectionName: topicName,
    connectionId: topicId
  })
  removeCallback(topicName, topicId, callback)
  await Promise.all([
    addedConnections.length > 0
      ? subscribeAdapter.subscribeToTopics(
          addedConnections.map(({ connectionName, connectionId }) => ({
            topicName: connectionName,
            topicId: connectionId
          }))
        )
      : Promise.resolve(),
    removedConnections.length > 0
      ? subscribeAdapter.unsubscribeFromTopics(
          removedConnections.map(({ connectionName, connectionId }) => ({
            topicName: connectionName,
            topicId: connectionId
          }))
        )
      : Promise.resolve()
  ])

  return { topicName, topicId }
}

export { doSubscribe, doUnsubscribe }
