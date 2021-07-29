import {
  QUERY_READMODEL_REQUEST,
  QUERY_READMODEL_SUCCESS,
  QUERY_READMODEL_FAILURE,
  DROP_READMODEL_STATE,
  CONNECT_READMODEL,
  DISCONNECT_READMODEL,
} from '../internal/action-types'
import { ReadModelQuery } from '@resolve-js/client'

export type ReadModelAction = {
  query: ReadModelQuery
  selectorId?: string
}

export type QueryReadModelRequestAction = {
  type: typeof QUERY_READMODEL_REQUEST
  initialState: any
  selectorId?: string
} & ReadModelAction
export const queryReadModelRequest = (
  query: ReadModelQuery,
  initialState: any,
  selectorId?: string
): QueryReadModelRequestAction => ({
  type: QUERY_READMODEL_REQUEST,
  query,
  initialState,
  selectorId,
})

export type QueryReadModelSuccessAction = {
  type: typeof QUERY_READMODEL_SUCCESS
  result: any
} & ReadModelAction
export const queryReadModelSuccess = (
  query: ReadModelQuery,
  result: any,
  selectorId?: string
): QueryReadModelSuccessAction => ({
  type: QUERY_READMODEL_SUCCESS,
  query,
  result,
  selectorId,
})
export type QueryReadModelFailureAction = {
  type: typeof QUERY_READMODEL_FAILURE
  error: Error
} & ReadModelAction
export const queryReadModelFailure = (
  query: ReadModelQuery,
  error: Error,
  selectorId?: string
): QueryReadModelFailureAction => ({
  type: QUERY_READMODEL_FAILURE,
  query,
  error,
  selectorId,
})

export type DropReadModelResultAction = {
  type: typeof DROP_READMODEL_STATE
} & ReadModelAction
export const dropReadModelResult = (
  query: ReadModelQuery,
  selectorId?: string
): DropReadModelResultAction => ({
  type: DROP_READMODEL_STATE,
  query,
  selectorId,
})

export type ConnectReadModelAction = {
  type: typeof CONNECT_READMODEL
  skipConnectionManager?: boolean
} & ReadModelAction
export const connectReadModel = (
  query: ReadModelQuery,
  skipConnectionManager?: boolean
): ConnectReadModelAction => ({
  type: CONNECT_READMODEL,
  query,
  skipConnectionManager,
})

export type DisconnectReadModelAction = {
  type: typeof DISCONNECT_READMODEL
} & ReadModelAction
export const disconnectReadModel = (
  query: ReadModelQuery
): DisconnectReadModelAction => ({
  type: DISCONNECT_READMODEL,
  query,
})
