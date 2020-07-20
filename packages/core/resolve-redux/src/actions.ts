import { Action } from 'redux'
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
  QUERY_READMODEL_REQUEST,
  QUERY_READMODEL_SUCCESS,
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

export type SendCommandRequestAction = {
  type: typeof SEND_COMMAND_REQUEST
  commandType: string
  aggregateId: string
  aggregateName: string
  payload: any
}
export const sendCommandRequest = (
  commandType: string,
  aggregateId: string,
  aggregateName: string,
  payload: any
): SendCommandRequestAction => ({
  type: SEND_COMMAND_REQUEST,
  commandType,
  aggregateId,
  aggregateName,
  payload
})

export const sendCommandSuccess = (
  commandType: string,
  aggregateId: string,
  aggregateName: string,
  payload: any
) => ({
  type: SEND_COMMAND_SUCCESS,
  commandType,
  aggregateId,
  aggregateName,
  payload
})

export const sendCommandFailure = (
  commandType: string,
  aggregateId: string,
  aggregateName: string,
  payload: any,
  error: Error
) => ({
  type: SEND_COMMAND_FAILURE,
  commandType,
  aggregateId,
  aggregateName,
  payload,
  error
})

export const subscribeTopicRequest = (topicName: string, topicId: string) => ({
  type: SUBSCRIBE_TOPIC_REQUEST,
  topicName,
  topicId
})

export const subscribeTopicSuccess = (topicName: string, topicId: string) => ({
  type: SUBSCRIBE_TOPIC_SUCCESS,
  topicName,
  topicId
})

export const subscribeTopicFailure = (
  topicName: string,
  topicId: string,
  error: Error
) => ({
  type: SUBSCRIBE_TOPIC_FAILURE,
  topicName,
  topicId,
  error
})

export const unsubscribeTopicRequest = (
  topicName: string,
  topicId: string
) => ({
  type: UNSUBSCRIBE_TOPIC_REQUEST,
  topicName,
  topicId
})

export const unsubscribeTopicSuccess = (
  topicName: string,
  topicId: string
) => ({
  type: UNSUBSCRIBE_TOPIC_SUCCESS,
  topicName,
  topicId
})

export const unsubscribeTopicFailure = (
  topicName: string,
  topicId: string,
  error: string
) => ({
  type: UNSUBSCRIBE_TOPIC_FAILURE,
  topicName,
  topicId,
  error
})

export const connectViewModel = (
  viewModelName: string,
  aggregateIds: string | string[],
  aggregateArgs: any
) => ({
  type: CONNECT_VIEWMODEL,
  viewModelName,
  aggregateIds,
  aggregateArgs
})

export const disconnectViewModel = (
  viewModelName: string,
  aggregateIds: string | string[],
  aggregateArgs: any
) => ({
  type: DISCONNECT_VIEWMODEL,
  viewModelName,
  aggregateIds,
  aggregateArgs
})

export const loadViewModelStateRequest = (
  viewModelName: string,
  aggregateIds: string | string[],
  aggregateArgs: any
) => ({
  type: LOAD_VIEWMODEL_STATE_REQUEST,
  viewModelName,
  aggregateIds,
  aggregateArgs
})

// TODO fix docs
export const loadViewModelStateSuccess = (
  viewModelName: string,
  aggregateIds: string | string[],
  aggregateArgs: any,
  result: any,
  timestamp: any
) => ({
  type: LOAD_VIEWMODEL_STATE_SUCCESS,
  viewModelName,
  aggregateIds,
  aggregateArgs,
  result,
  timestamp
})

export const loadViewModelStateFailure = (
  viewModelName: string,
  aggregateIds: string | string[],
  aggregateArgs: any,
  error: Error
) => ({
  type: LOAD_VIEWMODEL_STATE_FAILURE,
  viewModelName,
  aggregateIds,
  aggregateArgs,
  error
})

export const dropViewModelState = (
  viewModelName: string,
  aggregateIds: string | string[],
  aggregateArgs: any
) => ({
  type: DROP_VIEWMODEL_STATE,
  viewModelName,
  aggregateIds,
  aggregateArgs
})

export const connectReadModel = (
  readModelName: string,
  resolverName: string,
  resolverArgs: any
) => ({
  type: CONNECT_READMODEL,
  readModelName,
  resolverName,
  resolverArgs
})

export const disconnectReadModel = (
  readModelName: string,
  resolverName: string,
  resolverArgs: any
) => ({
  type: DISCONNECT_READMODEL,
  readModelName,
  resolverName,
  resolverArgs
})

export type QueryReadModelRequestAction = {
  type: typeof QUERY_READMODEL_REQUEST
  readModelName: string
  resolverName: string
  resolverArgs: any
  queryId: string
}
export const queryReadModelRequest = (
  readModelName: string,
  resolverName: string,
  resolverArgs: any,
  queryId: string
): QueryReadModelRequestAction => ({
  type: QUERY_READMODEL_REQUEST,
  readModelName,
  resolverName,
  resolverArgs,
  queryId
})

export type QueryReadModelSuccessAction = {
  type: typeof QUERY_READMODEL_SUCCESS
  readModelName: string
  resolverName: string
  resolverArgs: any
  queryId: any
  result: any
  timestamp: any
}
export const queryReadModelSuccess = (
  readModelName: string,
  resolverName: string,
  resolverArgs: any,
  queryId: any,
  result: any,
  timestamp: any
): QueryReadModelSuccessAction => ({
  type: QUERY_READMODEL_SUCCESS,
  readModelName,
  resolverName,
  resolverArgs,
  queryId,
  result,
  timestamp
})
export type QueryReadModelFailureAction = {
  type: typeof LOAD_READMODEL_STATE_FAILURE
  readModelName: string
  resolverName: string
  resolverArgs: any
  queryId: any
  error: Error
}
export const queryReadModelFailure = (
  readModelName: string,
  resolverName: string,
  resolverArgs: any,
  queryId: any,
  error: Error
): QueryReadModelFailureAction => ({
  type: LOAD_READMODEL_STATE_FAILURE,
  readModelName,
  resolverName,
  resolverArgs,
  queryId,
  error
})

export const dropReadModelState = (
  readModelName: string,
  resolverName: string,
  resolverArgs: any
) => ({
  type: DROP_READMODEL_STATE,
  readModelName,
  resolverName,
  resolverArgs
})

export const dispatchTopicMessage = (message: string) => ({
  type: DISPATCH_TOPIC_MESSAGE,
  message
})

export const hotModuleReplacement = (hotModuleReplacementId: any) => ({
  type: HOT_MODULE_REPLACEMENT,
  hotModuleReplacementId
})

export const updateJwt = (jwt: any) => ({
  type: UPDATE_JWT,
  jwt
})

export const logout = () => ({
  type: LOGOUT
})

export const authRequest = (url: string, body: any = {}, method: string) => ({
  type: AUTH_REQUEST,
  url,
  body,
  method
})

export const authSuccess = (url: string, body: any, method: string) => ({
  type: AUTH_SUCCESS,
  url,
  body,
  method
})

export const authFailure = (
  url: string,
  body: any,
  method: string,
  error: Error
) => ({
  type: AUTH_FAILURE,
  url,
  body,
  method,
  error
})
