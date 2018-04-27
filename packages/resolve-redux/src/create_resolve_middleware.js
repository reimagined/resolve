import {
  SEND_COMMAND,
  HOT_MODULE_REPLACEMENT,
  SUBSCRIBE_VIEWMODEL,
  UNSUBSCRIBE_VIEWMODEL,
  SUBSCRIBE_READMODEL,
  UNSUBSCRIBE_READMODEL
} from './action_types'
import { createOrderedFetch } from './utils'
import actions from './actions'
import defaultSubscribeAdapter from './subscribe_adapter'
import sendCommand from './send_command'
import createActions from './create_actions'
import mockSubscribeAdapter from './mock_subscribe_adapter'
import subscribeViewModel from './subscribe_view_model'
import unsubscribeViewModel from './unsubscribe_view_model'
import subscribeReadModel from './subscribe_read_model'
import unsubscribeReadModel from './unsubscribe_read_model'

const REFRESH_TIMEOUT = 1000

const isClient = typeof window !== 'undefined'

export function createResolveMiddleware({
  viewModels = [],
  readModels = [],
  aggregates = [],
  subscribeAdapter = defaultSubscribeAdapter,
  origin,
  rootPath
}) {
  const subscribers = {
    viewModels: {},
    aggregateIds: {}
  }

  const requests = {}
  const loading = {}
  const readModelSubscriptions = {}

  for (const { name } of viewModels) {
    loading[name] = {}
  }

  const aggregateActions = {}
  for (const aggregate of aggregates) {
    Object.assign(aggregateActions, createActions(aggregate))
  }

  const orderedFetch = createOrderedFetch()

  return store => {
    const adapter = (isClient ? subscribeAdapter : mockSubscribeAdapter)({
      origin,
      rootPath
    })
    adapter.onEvent(event => store.dispatch(event))
    adapter.onDisconnect(error => {
      store.dispatch(actions.disconnect(error))

      Object.keys(readModelSubscriptions).forEach(subscriptionKey => {
        readModelSubscriptions[subscriptionKey].refresh()
      })
    })

    const context = {
      origin,
      rootPath,
      adapter,
      viewModels,
      readModels,
      aggregates,
      aggregateActions,
      store,
      subscribers,
      requests,
      readModelSubscriptions,
      orderedFetch
    }

    Object.defineProperty(store.getState, 'isLoadingViewModel', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: (viewModelName, aggregateId) =>
        !!loading[viewModelName][aggregateId]
    })
    Object.defineProperty(store.getState, 'aggregateActions', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: aggregateActions
    })

    store.dispatch(actions.provideViewModels(viewModels))

    if (!isClient) {
      return next => action => next(action)
    }

    let hotModuleReplacementId

    return next => action => {
      switch (action.type) {
        case HOT_MODULE_REPLACEMENT: {
          if (!hotModuleReplacementId) {
            hotModuleReplacementId = action.hotModuleReplacementId
          }
          if (hotModuleReplacementId !== action.hotModuleReplacementId) {
            window.location.reload()
          }
          break
        }
        case SUBSCRIBE_VIEWMODEL: {
          const { viewModelName, aggregateId } = action

          loading[viewModelName][aggregateId] = true

          subscribeViewModel(context, action).catch(error =>
            setTimeout(() => {
              // eslint-disable-next-line no-console
              console.error(error)
              store.dispatch(action)
            }, REFRESH_TIMEOUT)
          )
          break
        }
        case UNSUBSCRIBE_VIEWMODEL: {
          const { viewModelName, aggregateId } = action

          delete loading[viewModelName][aggregateId]

          unsubscribeViewModel(context, action)
          break
        }
        case SUBSCRIBE_READMODEL: {
          subscribeReadModel(context, action)
          break
        }
        case UNSUBSCRIBE_READMODEL: {
          unsubscribeReadModel(context, action)
          break
        }
        case SEND_COMMAND: {
          sendCommand(context, action)
          break
        }
        default:
      }

      return next(action)
    }
  }
}

export default createResolveMiddleware
