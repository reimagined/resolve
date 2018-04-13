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

function merge(viewModelName, aggregateId, state) {
  return {
    type: MERGE,
    viewModelName,
    aggregateId,
    state
  }
}

function sendCommand({ command, aggregateId, aggregateName, payload }) {
  return {
    type: SEND_COMMAND,
    command,
    aggregateId,
    aggregateName,
    payload
  }
}

function subscribeViewmodel(viewModelName, aggregateId) {
  return {
    type: SUBSCRIBE_VIEWMODEL,
    viewModelName,
    aggregateId
  }
}

function unsubscribeViewmodel(viewModelName, aggregateId) {
  return {
    type: UNSUBSCRIBE_VIEWMODEL,
    viewModelName,
    aggregateId
  }
}

function subscribeReadmodel(
  readModelName,
  resolverName,
  parameters,
  isReactive
) {
  return {
    type: SUBSCRIBE_READMODEL,
    readModelName,
    resolverName,
    parameters,
    isReactive
  }
}

function unsubscribeReadmodel(readModelName, resolverName) {
  return {
    type: UNSUBSCRIBE_READMODEL,
    readModelName,
    resolverName
  }
}

function loadReadmodelInitialState(
  readModelName,
  resolverName,
  initialState,
  serialId
) {
  return {
    type: READMODEL_LOAD_INITIAL_STATE,
    readModelName,
    resolverName,
    initialState,
    serialId
  }
}

function dropReadmodelState(readModelName, resolverName) {
  return {
    type: READMODEL_DROP_STATE,
    readModelName,
    resolverName
  }
}

function provideViewModels(viewModels) {
  return {
    type: PROVIDE_VIEW_MODELS,
    viewModels
  }
}

function disconnect(reason) {
  return {
    type: DISCONNECT,
    reason
  }
}

function hotModuleReplacement() {
  return {
    type: HOT_MODULE_REPLACEMENT,
    hotModuleReplacementId: uuid()
  }
}

export default {
  merge,
  sendCommand,
  subscribeViewmodel,
  unsubscribeViewmodel,
  provideViewModels,
  subscribeReadmodel,
  unsubscribeReadmodel,
  loadReadmodelInitialState,
  dropReadmodelState,
  disconnect,
  hotModuleReplacement
}
