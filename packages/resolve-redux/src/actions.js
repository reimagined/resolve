import uuid from 'uuid/v4'

import {
  MERGE,
  SEND_COMMAND,
  SUBSCRIBE_VIEWMODEL,
  UNSUBSCRIBE_VIEWMODEL,
  SUBSCRIBE_READMODEL,
  UNSUBSCRIBE_READMODEL,
  READMODEL_LOAD_INITIAL_STATE,
  READMODEL_DROP_STATE,
  PROVIDE_VIEW_MODELS,
  DISCONNECT,
  HOT_MODULE_REPLACEMENT
} from './action_types'

const merge = (viewModelName, aggregateId, state) => ({
  type: MERGE,
  viewModelName,
  aggregateId,
  state
})

const sendCommand = ({ command, aggregateId, aggregateName, payload }) => ({
  type: SEND_COMMAND,
  command,
  aggregateId,
  aggregateName,
  payload
})

const subscribeViewModel = (viewModelName, aggregateId) => ({
  type: SUBSCRIBE_VIEWMODEL,
  viewModelName,
  aggregateId
})

const unsubscribeViewModel = (viewModelName, aggregateId) => ({
  type: UNSUBSCRIBE_VIEWMODEL,
  viewModelName,
  aggregateId
})

const subscribeReadModel = (
  readModelName,
  resolverName,
  parameters,
  isReactive
) => ({
  type: SUBSCRIBE_READMODEL,
  readModelName,
  resolverName,
  parameters,
  isReactive
})

const unsubscribeReadModel = (readModelName, resolverName) => ({
  type: UNSUBSCRIBE_READMODEL,
  readModelName,
  resolverName
})

const loadReadModelInitialState = (
  readModelName,
  resolverName,
  initialState,
  serialId
) => ({
  type: READMODEL_LOAD_INITIAL_STATE,
  readModelName,
  resolverName,
  initialState,
  serialId
})

const dropReadModelState = (readModelName, resolverName) => ({
  type: READMODEL_DROP_STATE,
  readModelName,
  resolverName
})

const provideViewModels = viewModels => ({
  type: PROVIDE_VIEW_MODELS,
  viewModels
})

const disconnect = reason => ({
  type: DISCONNECT,
  reason
})

const hotModuleReplacement = () => ({
  type: HOT_MODULE_REPLACEMENT,
  hotModuleReplacementId: uuid()
})

export default {
  merge,
  sendCommand,
  subscribeViewModel,
  unsubscribeViewModel,
  provideViewModels,
  subscribeReadModel,
  unsubscribeReadModel,
  loadReadModelInitialState,
  dropReadModelState,
  disconnect,
  hotModuleReplacement
}
