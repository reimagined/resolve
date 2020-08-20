import AppContainer from './app-container'
import createStore from './create-store'

import connectStaticBasedUrls from './urls/connect-static-based-urls'
import connectRootBasedUrls from './urls/connect-root-based-urls'
import connectReadModel from './read-model/connect-read-model'
import connectViewModel from './view-model/connect-view-model'

import { sendAggregateAction } from './command/send-aggregate-action'
import { useReduxCommand } from './command/use-redux-command'
import { useReduxReadModel } from './read-model/use-redux-read-model'
import { useReduxReadModelSelector } from './read-model/use-redux-read-model-selector'
import { useReduxViewModel } from './view-model/use-redux-view-model'
import { useReduxViewModelSelector } from './view-model/use-redux-view-model-selector'

import getOrigin from './internal/get-origin'
import { Provider, Consumer } from './internal/resolve-context'
import Providers from './internal/providers'
import * as actionTypes from './internal/action-types'
import deserializeInitialState from './internal/deserialize-initial-state'
import connectResolveAdvanced from './internal/connect-resolve-advanced'

import { ResultStatus } from './types'

const internal = {
  actionTypes,
  getOrigin,
  Provider,
  Consumer,
  Providers,
  deserializeInitialState
}

export {
  AppContainer,
  createStore,
  sendAggregateAction,
  connectViewModel,
  connectReadModel,
  connectStaticBasedUrls,
  connectRootBasedUrls,
  useReduxReadModel,
  useReduxReadModelSelector,
  useReduxCommand,
  useReduxViewModel,
  useReduxViewModelSelector,
  ResultStatus,
  internal,
  // deprecated, encapsulation breach
  getOrigin,
  deserializeInitialState,
  connectResolveAdvanced
}
