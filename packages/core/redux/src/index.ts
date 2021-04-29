import { createResolveStore } from './create-resolve-store'

import { connectStaticBasedUrls } from './urls/connect-static-based-urls'
import { connectRootBasedUrls } from './urls/connect-root-based-urls'
import connectReadModel from './read-model/connect-read-model'
import connectViewModel from './view-model/connect-view-model'

import { sendAggregateAction } from './command/send-aggregate-action'
import { useReduxCommand } from './command/use-redux-command'
import { useReduxReadModel } from './read-model/use-redux-read-model'
import { useReduxReadModelSelector } from './read-model/use-redux-read-model-selector'
import { useReduxViewModel } from './view-model/use-redux-view-model'
import { useReduxViewModelSelector } from './view-model/use-redux-view-model-selector'

import getOrigin from './internal/get-origin'
import * as actionTypes from './internal/action-types'
import deserializeInitialState from './internal/deserialize-initial-state'

import { ResultStatus } from './types'
import { ResolveReduxProvider } from './resolve-redux-provider'

const internal = {
  actionTypes,
  getOrigin,
  deserializeInitialState,
}

export {
  ResolveReduxProvider,
  createResolveStore,
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
}
