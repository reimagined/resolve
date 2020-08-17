import {
  QUERY_VIEWMODEL_REQUEST,
  QUERY_VIEWMODEL_SUCCESS,
  QUERY_VIEWMODEL_FAILURE,
  DROP_VIEWMODEL_STATE,
  CONNECT_VIEWMODEL,
  DISCONNECT_VIEWMODEL,
  VIEWMODEL_STATE_UPDATE
} from '../action-types'
import { ViewModelQuery } from 'resolve-client'

type ViewModelAction = {
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
  selectorId
})

export type QueryViewModelSuccessAction = {
  type: typeof QUERY_VIEWMODEL_SUCCESS
  result: any
  timestamp: number
} & ViewModelAction
export const queryViewModelSuccess = (
  query: ViewModelQuery,
  result: any,
  timestamp: number,
  selectorId?: string
): QueryViewModelSuccessAction => ({
  type: QUERY_VIEWMODEL_SUCCESS,
  query,
  result,
  timestamp,
  selectorId
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
  selectorId
})

export type ViewModelStateUpdateAction = {
  type: typeof VIEWMODEL_STATE_UPDATE
  result: any
  timestamp: number
} & ViewModelAction
export const viewModelStateUpdate = (
  query: ViewModelQuery,
  result: any,
  timestamp: number,
  selectorId?: string
): ViewModelStateUpdateAction => ({
  type: VIEWMODEL_STATE_UPDATE,
  query,
  result,
  timestamp,
  selectorId
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
  selectorId
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
  selectorId
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
  selectorId
})
