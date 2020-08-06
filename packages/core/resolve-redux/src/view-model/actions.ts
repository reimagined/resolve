import {
  QUERY_VIEWMODEL_REQUEST,
  QUERY_VIEWMODEL_SUCCESS,
  QUERY_VIEWMODEL_FAILURE,
  DROP_VIEWMODEL_STATE,
  CONNECT_VIEWMODEL,
  DISCONNECT_VIEWMODEL,
  SUBSCRIBE_TOPIC_REQUEST,
  SUBSCRIBE_TOPIC_SUCCESS,
  SUBSCRIBE_TOPIC_FAILURE,
  UNSUBSCRIBE_TOPIC_REQUEST,
  UNSUBSCRIBE_TOPIC_SUCCESS,
  UNSUBSCRIBE_TOPIC_FAILURE
} from '../action-types'

type ViewModelAction = {
  viewModelName: string
  aggregateIds: string | string[]
  aggregateArgs: any
  selectorId?: string
}

export type QueryViewModelRequestAction = {
  type: typeof QUERY_VIEWMODEL_REQUEST
} & ViewModelAction
export const queryViewModelRequest = (
  viewModelName: string,
  aggregateIds: string | string[],
  aggregateArgs: any,
  selectorId?: string
): QueryViewModelRequestAction => ({
  type: QUERY_VIEWMODEL_REQUEST,
  viewModelName,
  aggregateIds,
  aggregateArgs,
  selectorId
})

export type QueryViewModelSuccessAction = {
  type: typeof QUERY_VIEWMODEL_SUCCESS
  result: any
  timestamp: number
} & ViewModelAction
export const queryViewModelSuccess = (
  viewModelName: string,
  aggregateIds: string | string[],
  aggregateArgs: any,
  result: any,
  timestamp: number,
  selectorId?: string
): QueryViewModelSuccessAction => ({
  type: QUERY_VIEWMODEL_SUCCESS,
  viewModelName,
  aggregateIds,
  aggregateArgs,
  result,
  timestamp,
  selectorId
})

export type QueryViewModelFailureAction = {
  type: typeof QUERY_VIEWMODEL_FAILURE
  error: Error
} & ViewModelAction
export const queryViewModelFailure = (
  viewModelName: string,
  aggregateIds: string | string[],
  aggregateArgs: any,
  error: Error,
  selectorId?: string
): QueryViewModelFailureAction => ({
  type: QUERY_VIEWMODEL_FAILURE,
  viewModelName,
  aggregateIds,
  aggregateArgs,
  error,
  selectorId
})

export type DropViewModelStateAction = {
  type: typeof DROP_VIEWMODEL_STATE
} & ViewModelAction
export const dropViewModelState = (
  viewModelName: string,
  aggregateIds: string | string[],
  aggregateArgs: any,
  selectorId?: string
): DropViewModelStateAction => ({
  type: DROP_VIEWMODEL_STATE,
  viewModelName,
  aggregateIds,
  aggregateArgs,
  selectorId
})

export type ConnectViewModelAction = {
  type: typeof CONNECT_VIEWMODEL
} & ViewModelAction
export const connectViewModel = (
  viewModelName: string,
  aggregateIds: string | string[],
  aggregateArgs: any,
  selectorId?: string
): ConnectViewModelAction => ({
  type: CONNECT_VIEWMODEL,
  viewModelName,
  aggregateIds,
  aggregateArgs,
  selectorId
})

export type DisconnectViewModelAction = {
  type: typeof DISCONNECT_VIEWMODEL
} & ViewModelAction
export const disconnectViewModel = (
  viewModelName: string,
  aggregateIds: string | string[],
  aggregateArgs: any,
  selectorId?: string
): DisconnectViewModelAction => ({
  type: DISCONNECT_VIEWMODEL,
  viewModelName,
  aggregateIds,
  aggregateArgs,
  selectorId
})

type TopicAction = {
  topicName: string
  topicId: string
}

export type SubscribeTopicRequestAction = {
  type: typeof SUBSCRIBE_TOPIC_REQUEST
} & TopicAction
export const subscribeTopicRequest = (
  topicName: string,
  topicId: string
): SubscribeTopicRequestAction => ({
  type: SUBSCRIBE_TOPIC_REQUEST,
  topicName,
  topicId
})

export type SubscribeTopicSuccessAction = {
  type: typeof SUBSCRIBE_TOPIC_SUCCESS
} & TopicAction
export const subscribeTopicSuccess = (
  topicName: string,
  topicId: string
): SubscribeTopicSuccessAction => ({
  type: SUBSCRIBE_TOPIC_SUCCESS,
  topicName,
  topicId
})

export type SubscribeTopicFailureAction = {
  type: typeof SUBSCRIBE_TOPIC_FAILURE
  error: Error
} & TopicAction
export const subscribeTopicFailure = (
  topicName: string,
  topicId: string,
  error: Error
): SubscribeTopicFailureAction => ({
  type: SUBSCRIBE_TOPIC_FAILURE,
  topicName,
  topicId,
  error
})

export type UnsubscribeTopicRequestAction = {
  type: typeof UNSUBSCRIBE_TOPIC_REQUEST
} & TopicAction
export const unsubscribeTopicRequest = (
  topicName: string,
  topicId: string
): UnsubscribeTopicRequestAction => ({
  type: UNSUBSCRIBE_TOPIC_REQUEST,
  topicName,
  topicId
})

export type UnsubscribeTopicSuccessAction = {
  type: typeof UNSUBSCRIBE_TOPIC_SUCCESS
} & TopicAction
export const unsubscribeTopicSuccess = (
  topicName: string,
  topicId: string
): UnsubscribeTopicSuccessAction => ({
  type: UNSUBSCRIBE_TOPIC_SUCCESS,
  topicName,
  topicId
})

export type UnsubscribeTopicFailureAction = {
  type: typeof UNSUBSCRIBE_TOPIC_FAILURE
  error: Error
} & TopicAction
export const unsubscribeTopicFailure = (
  topicName: string,
  topicId: string,
  error: Error
): UnsubscribeTopicFailureAction => ({
  type: UNSUBSCRIBE_TOPIC_FAILURE,
  topicName,
  topicId,
  error
})
