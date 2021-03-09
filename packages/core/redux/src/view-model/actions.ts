import {
  QUERY_VIEWMODEL_REQUEST,
  QUERY_VIEWMODEL_SUCCESS,
  QUERY_VIEWMODEL_FAILURE,
  DROP_VIEWMODEL_STATE,
  CONNECT_VIEWMODEL,
  DISCONNECT_VIEWMODEL,
  VIEWMODEL_STATE_UPDATE,
  VIEWMODEL_EVENT_RECEIVED,
} from '../internal/action-types'
import { ViewModelQuery } from '@resolve-js/client'
import { ViewModelReactiveEvent } from '../types'

export type ViewModelAction = {
  query: ViewModelQuery
  selectorId?: string
}

export type QueryViewModelRequestAction = {
  type: typeof QUERY_VIEWMODEL_REQUEST
} & ViewModelAction
export const queryViewModelRequest = (
  query: ViewModelQuery,
  selectorId?: string
): QueryViewModelRequestAction => ({
  type: QUERY_VIEWMODEL_REQUEST,
  query,
  selectorId,
})

export type QueryViewModelSuccessAction = {
  type: typeof QUERY_VIEWMODEL_SUCCESS
  result: any
} & ViewModelAction
export const queryViewModelSuccess = (
  query: ViewModelQuery,
  result: any,
  selectorId?: string
): QueryViewModelSuccessAction => ({
  type: QUERY_VIEWMODEL_SUCCESS,
  query,
  result,
  selectorId,
})

export type QueryViewModelFailureAction = {
  type: typeof QUERY_VIEWMODEL_FAILURE
  error: Error
} & ViewModelAction
export const queryViewModelFailure = (
  query: ViewModelQuery,
  error: Error,
  selectorId?: string
): QueryViewModelFailureAction => ({
  type: QUERY_VIEWMODEL_FAILURE,
  query,
  error,
  selectorId,
})

export type ViewModelStateUpdateAction = {
  type: typeof VIEWMODEL_STATE_UPDATE
  state: any
  initial: boolean
} & ViewModelAction
export const viewModelStateUpdate = (
  query: ViewModelQuery,
  state: any,
  initial: boolean,
  selectorId?: string
): ViewModelStateUpdateAction => ({
  type: VIEWMODEL_STATE_UPDATE,
  query,
  state,
  initial,
  selectorId,
})

export type ViewModelEventReceivedAction = {
  type: typeof VIEWMODEL_EVENT_RECEIVED
  event: ViewModelReactiveEvent
} & ViewModelAction
export const viewModelEventReceived = (
  query: ViewModelQuery,
  event: ViewModelReactiveEvent,
  selectorId?: string
): ViewModelEventReceivedAction => ({
  type: VIEWMODEL_EVENT_RECEIVED,
  query,
  event,
  selectorId,
})

export type DropViewModelStateAction = {
  type: typeof DROP_VIEWMODEL_STATE
} & ViewModelAction
export const dropViewModelState = (
  query: ViewModelQuery,
  selectorId?: string
): DropViewModelStateAction => ({
  type: DROP_VIEWMODEL_STATE,
  query,
  selectorId,
})

export type ConnectViewModelAction = {
  type: typeof CONNECT_VIEWMODEL
} & ViewModelAction
export const connectViewModel = (
  query: ViewModelQuery,
  selectorId?: string
): ConnectViewModelAction => ({
  type: CONNECT_VIEWMODEL,
  query,
  selectorId,
})

export type DisconnectViewModelAction = {
  type: typeof DISCONNECT_VIEWMODEL
} & ViewModelAction
export const disconnectViewModel = (
  query: ViewModelQuery,
  selectorId?: string
): DisconnectViewModelAction => ({
  type: DISCONNECT_VIEWMODEL,
  query,
  selectorId,
})
