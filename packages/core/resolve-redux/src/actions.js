import {
  SEND_COMMAND_REQUEST,
  SEND_COMMAND_SUCCESS,
  SEND_COMMAND_FAILURE,
  SUBSCRIBE_TOPIC_REQUEST,
  SUBSCRIBE_TOPIC_SUCCESS,
  SUBSCRIBE_TOPIC_FAILURE,
  UNSUBSCRIBE_TOPIC_REQUEST,
  UNSUBSCRIBE_TOPIC_SUCCESS,
  UNSUBSCRIBE_TOPIC_FAILURE,
  CONNECT_VIEWMODEL,
  DISCONNECT_VIEWMODEL,
  LOAD_VIEWMODEL_STATE_REQUEST,
  LOAD_VIEWMODEL_STATE_SUCCESS,
  LOAD_VIEWMODEL_STATE_FAILURE,
  DROP_VIEWMODEL_STATE,
  CONNECT_READMODEL,
  DISCONNECT_READMODEL,
  LOAD_READMODEL_STATE_REQUEST,
  LOAD_READMODEL_STATE_SUCCESS,
  LOAD_READMODEL_STATE_FAILURE,
  DROP_READMODEL_STATE,
  DISPATCH_TOPIC_MESSAGE,
  HOT_MODULE_REPLACEMENT,
  UPDATE_JWT,
  LOGOUT,
  AUTH_REQUEST,
  AUTH_SUCCESS,
  AUTH_FAILURE
} from './action_types'

export const sendCommandRequest = (
  commandType,
  aggregateId,
  aggregateName,
  payload
) => ({
  type: SEND_COMMAND_REQUEST,
  commandType,
  aggregateId,
  aggregateName,
  payload
})

export const sendCommandSuccess = (
  commandType,
  aggregateId,
  aggregateName,
  payload
) => ({
  type: SEND_COMMAND_SUCCESS,
  commandType,
  aggregateId,
  aggregateName,
  payload
})

export const sendCommandFailure = (
  commandType,
  aggregateId,
  aggregateName,
  payload,
  error
) => ({
  type: SEND_COMMAND_FAILURE,
  commandType,
  aggregateId,
  aggregateName,
  payload,
  error
})

export const subscribeTopicRequest = (topicName, topicId) => ({
  type: SUBSCRIBE_TOPIC_REQUEST,
  topicName,
  topicId
})

export const subscribeTopicSuccess = (topicName, topicId) => ({
  type: SUBSCRIBE_TOPIC_SUCCESS,
  topicName,
  topicId
})

export const subscribeTopicFailure = (topicName, topicId, error) => ({
  type: SUBSCRIBE_TOPIC_FAILURE,
  topicName,
  topicId,
  error
})

export const unsubscribeTopicRequest = (topicName, topicId) => ({
  type: UNSUBSCRIBE_TOPIC_REQUEST,
  topicName,
  topicId
})

export const unsubscribeTopicSuccess = (topicName, topicId) => ({
  type: UNSUBSCRIBE_TOPIC_SUCCESS,
  topicName,
  topicId
})

export const unsubscribeTopicFailure = (topicName, topicId, error) => ({
  type: UNSUBSCRIBE_TOPIC_FAILURE,
  topicName,
  topicId,
  error
})

export const connectViewModel = (
  viewModelName,
  aggregateIds,
  aggregateArgs
) => ({
  type: CONNECT_VIEWMODEL,
  viewModelName,
  aggregateIds,
  aggregateArgs
})

export const disconnectViewModel = (
  viewModelName,
  aggregateIds,
  aggregateArgs
) => ({
  type: DISCONNECT_VIEWMODEL,
  viewModelName,
  aggregateIds,
  aggregateArgs
})

export const loadViewModelStateRequest = (
  viewModelName,
  aggregateIds,
  aggregateArgs
) => ({
  type: LOAD_VIEWMODEL_STATE_REQUEST,
  viewModelName,
  aggregateIds,
  aggregateArgs
})

// TODO fix docs
export const loadViewModelStateSuccess = (
  viewModelName,
  aggregateIds,
  aggregateArgs,
  result,
  timestamp
) => ({
  type: LOAD_VIEWMODEL_STATE_SUCCESS,
  viewModelName,
  aggregateIds,
  aggregateArgs,
  result,
  timestamp
})

export const loadViewModelStateFailure = (
  viewModelName,
  aggregateIds,
  aggregateArgs,
  error
) => ({
  type: LOAD_VIEWMODEL_STATE_FAILURE,
  viewModelName,
  aggregateIds,
  aggregateArgs,
  error
})

export const dropViewModelState = (
  viewModelName,
  aggregateIds,
  aggregateArgs
) => ({
  type: DROP_VIEWMODEL_STATE,
  viewModelName,
  aggregateIds,
  aggregateArgs
})

export const connectReadModel = (
  readModelName,
  resolverName,
  resolverArgs
) => ({
  type: CONNECT_READMODEL,
  readModelName,
  resolverName,
  resolverArgs
})

export const disconnectReadModel = (
  readModelName,
  resolverName,
  resolverArgs
) => ({
  type: DISCONNECT_READMODEL,
  readModelName,
  resolverName,
  resolverArgs
})

export const loadReadModelStateRequest = (
  readModelName,
  resolverName,
  resolverArgs,
  queryId
) => ({
  type: LOAD_READMODEL_STATE_REQUEST,
  readModelName,
  resolverName,
  resolverArgs,
  queryId
})

export const loadReadModelStateSuccess = (
  readModelName,
  resolverName,
  resolverArgs,
  queryId,
  result,
  timestamp
) => ({
  type: LOAD_READMODEL_STATE_SUCCESS,
  readModelName,
  resolverName,
  resolverArgs,
  queryId,
  result,
  timestamp
})

export const loadReadModelStateFailure = (
  readModelName,
  resolverName,
  resolverArgs,
  queryId,
  error
) => ({
  type: LOAD_READMODEL_STATE_FAILURE,
  readModelName,
  resolverName,
  resolverArgs,
  queryId,
  error
})

export const dropReadModelState = (
  readModelName,
  resolverName,
  resolverArgs
) => ({
  type: DROP_READMODEL_STATE,
  readModelName,
  resolverName,
  resolverArgs
})

export const dispatchTopicMessage = message => ({
  type: DISPATCH_TOPIC_MESSAGE,
  message
})

export const hotModuleReplacement = hotModuleReplacementId => ({
  type: HOT_MODULE_REPLACEMENT,
  hotModuleReplacementId
})

export const updateJwt = jwt => ({
  type: UPDATE_JWT,
  jwt
})

export const logout = () => ({
  type: LOGOUT
})

export const authRequest = (url, body = {}) => ({
  type: AUTH_REQUEST,
  url,
  body
})

export const authSuccess = (url, body) => ({
  type: AUTH_SUCCESS,
  url,
  body
})

export const authFailure = (url, body, error) => ({
  type: AUTH_FAILURE,
  url,
  body,
  error
})
