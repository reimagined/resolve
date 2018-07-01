import uuid from 'uuid/v4'

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
  APPLY_READMODEL_DIFF,
  DROP_READMODEL_STATE,
  DISPATCH_MQTT_MESSAGE,
  HOT_MODULE_REPLACEMENT,
  STOP_READ_MODEL_SUBSCRIPTION_REQUEST,
  STOP_READ_MODEL_SUBSCRIPTION_SUCCESS,
  STOP_READ_MODEL_SUBSCRIPTION_FAILURE
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

export const unsubscibeTopicRequest = (topicName, topicId) => ({
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

export const loadViewModelStateSuccess = (
  viewModelName,
  aggregateIds,
  aggregateArgs,
  state,
  aggregateVersionsMap
) => ({
  type: LOAD_VIEWMODEL_STATE_SUCCESS,
  viewModelName,
  aggregateIds,
  aggregateArgs,
  state,
  aggregateVersionsMap
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
  resolverArgs,
  isReactive
) => ({
  type: CONNECT_READMODEL,
  readModelName,
  resolverName,
  resolverArgs,
  isReactive
})

export const disconnectReadModel = (
  readModelName,
  resolverName,
  resolverArgs,
  isReactive
) => ({
  type: DISCONNECT_READMODEL,
  readModelName,
  resolverName,
  resolverArgs,
  isReactive
})

export const loadReadModelStateRequest = (
  readModelName,
  resolverName,
  resolverArgs,
  isReactive,
  queryId
) => ({
  type: LOAD_READMODEL_STATE_REQUEST,
  readModelName,
  resolverName,
  resolverArgs,
  isReactive,
  queryId
})

export const loadReadModelStateSuccess = (
  readModelName,
  resolverName,
  resolverArgs,
  isReactive,
  queryId,
  result,
  timeToLive
) => ({
  type: LOAD_READMODEL_STATE_SUCCESS,
  readModelName,
  resolverName,
  resolverArgs,
  isReactive,
  queryId,
  result,
  timeToLive
})

export const loadReadModelStateFailure = (
  readModelName,
  resolverName,
  resolverArgs,
  isReactive,
  queryId,
  error
) => ({
  type: LOAD_READMODEL_STATE_FAILURE,
  readModelName,
  resolverName,
  resolverArgs,
  isReactive,
  queryId,
  error
})

export const applyReadModelDiff = (
  readModelName,
  resolverName,
  resolverArgs,
  diff
) => ({
  type: APPLY_READMODEL_DIFF,
  readModelName,
  resolverName,
  resolverArgs,
  diff
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

export const stopReadModelSubscriptionRequest = queryId => ({
  type: STOP_READ_MODEL_SUBSCRIPTION_REQUEST,
  queryId
})

export const stopReadModelSubscriptionSuccess = queryId => ({
  type: STOP_READ_MODEL_SUBSCRIPTION_SUCCESS,
  queryId
})

export const stopReadModelSubscriptionFailure = (queryId, error) => ({
  type: STOP_READ_MODEL_SUBSCRIPTION_FAILURE,
  queryId,
  error
})

export const dispatchMqttMessage = message => ({
  type: DISPATCH_MQTT_MESSAGE,
  message
})

export const hotModuleReplacement = hotModuleReplacementId => ({
  type: HOT_MODULE_REPLACEMENT,
  hotModuleReplacementId
})
