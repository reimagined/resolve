import {
  QUERY_READMODEL_REQUEST,
  QUERY_READMODEL_SUCCESS,
  QUERY_READMODEL_FAILURE,
  DROP_READMODEL_STATE, CONNECT_READMODEL, DISCONNECT_READMODEL
} from '../action-types'

export type QueryReadModelRequestAction = {
  type: typeof QUERY_READMODEL_REQUEST
  readModelName: string
  resolverName: string
  resolverArgs: any
  selectorId?: string
}
export const queryReadModelRequest = (
  readModelName: string,
  resolverName: string,
  resolverArgs: any,
  selectorId?: string
): QueryReadModelRequestAction => ({
  type: QUERY_READMODEL_REQUEST,
  readModelName,
  resolverName,
  resolverArgs,
  selectorId
})

export type QueryReadModelSuccessAction = {
  type: typeof QUERY_READMODEL_SUCCESS
  readModelName: string
  resolverName: string
  resolverArgs: any
  result: any
  timestamp: any
  selectorId?: string
}
export const queryReadModelSuccess = (
  readModelName: string,
  resolverName: string,
  resolverArgs: any,
  result: any,
  timestamp: any,
  selectorId?: string
): QueryReadModelSuccessAction => ({
  type: QUERY_READMODEL_SUCCESS,
  readModelName,
  resolverName,
  resolverArgs,
  result,
  timestamp,
  selectorId
})
export type QueryReadModelFailureAction = {
  type: typeof QUERY_READMODEL_FAILURE
  readModelName: string
  resolverName: string
  resolverArgs: any
  error: Error
  selectorId?: string
}
export const queryReadModelFailure = (
  readModelName: string,
  resolverName: string,
  resolverArgs: any,
  error: Error,
  selectorId?: string
): QueryReadModelFailureAction => ({
  type: QUERY_READMODEL_FAILURE,
  readModelName,
  resolverName,
  resolverArgs,
  error,
  selectorId
})

export type DropReadModelResultAction = {
  type: typeof DROP_READMODEL_STATE
  readModelName: string
  resolverName: string
  resolverArgs: any
  selectorId?: string
}
export const dropReadModelResult = (
  readModelName: string,
  resolverName: string,
  resolverArgs: any,
  selectorId?: string
): DropReadModelResultAction => ({
  type: DROP_READMODEL_STATE,
  readModelName,
  resolverName,
  resolverArgs,
  selectorId
})

export type ConnectReadModelAction = {
  type: typeof CONNECT_READMODEL
  readModelName: string
  resolverName: string
  resolverArgs: any
  skipConnectionManager?: boolean
}
export const connectReadModel = (
  readModelName: string,
  resolverName: string,
  resolverArgs: any,
  skipConnectionManager?: boolean
): ConnectReadModelAction => ({
  type: CONNECT_READMODEL,
  readModelName,
  resolverName,
  resolverArgs,
  skipConnectionManager
})

export type DisconnectReadModelAction = {
  type: typeof DISCONNECT_READMODEL
  readModelName: string
  resolverName: string
  resolverArgs: any
}
export const disconnectReadModel = (
  readModelName: string,
  resolverName: string,
  resolverArgs: any
): DisconnectReadModelAction => ({
  type: DISCONNECT_READMODEL,
  readModelName,
  resolverName,
  resolverArgs
})
