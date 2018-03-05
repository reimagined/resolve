import {
  MERGE,
  SEND_COMMAND,
  SUBSCRIBE,
  UNSUBSCRIBE,
  SUBSCRIBE_READMODEL,
  UNSUBSCRIBE_READMODEL,
  READMODEL_LOAD_INITIAL_STATE,
  READMODEL_DROP_STATE,
  PROVIDE_VIEW_MODELS,
  DISCONNECT
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

function subscribe(viewModelName, aggregateId) {
  return {
    type: SUBSCRIBE,
    viewModelName,
    aggregateId
  }
}

function unsubscribe(viewModelName, aggregateId) {
  return {
    type: UNSUBSCRIBE,
    viewModelName,
    aggregateId
  }
}

function subscribeReadmodel(readModelName, resolverName, query, variables, isReactive) {
  return {
    type: SUBSCRIBE_READMODEL,
    readModelName,
    resolverName,
    query,
    variables,
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

function loadReadmodelInitialState(readModelName, resolverName, initialState) {
  return {
    type: READMODEL_LOAD_INITIAL_STATE,
    readModelName,
    resolverName,
    initialState
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

export default {
  merge,
  sendCommand,
  subscribe,
  unsubscribe,
  provideViewModels,
  subscribeReadmodel,
  unsubscribeReadmodel,
  loadReadmodelInitialState,
  dropReadmodelState,
  disconnect
}
