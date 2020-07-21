import {
  QUERY_READMODEL_REQUEST,
  QUERY_READMODEL_SUCCESS,
  QUERY_READMODEL_FAILURE,
  DROP_READMODEL_STATE
} from '../action-types'

export type QueryReadModelRequestAction = {
  type: typeof QUERY_READMODEL_REQUEST
  readModelName: string
  resolverName: string
  resolverArgs: any
}
export const queryReadModelRequest = (
  readModelName: string,
  resolverName: string,
  resolverArgs: any
): QueryReadModelRequestAction => ({
  type: QUERY_READMODEL_REQUEST,
  readModelName,
  resolverName,
  resolverArgs
})

export type QueryReadModelSuccessAction = {
  type: typeof QUERY_READMODEL_SUCCESS
  readModelName: string
  resolverName: string
  resolverArgs: any
  result: any
  timestamp: any
}
export const queryReadModelSuccess = (
  readModelName: string,
  resolverName: string,
  resolverArgs: any,
  result: any,
  timestamp: any
): QueryReadModelSuccessAction => ({
  type: QUERY_READMODEL_SUCCESS,
  readModelName,
  resolverName,
  resolverArgs,
  result,
  timestamp
})
export type QueryReadModelFailureAction = {
  type: typeof QUERY_READMODEL_FAILURE
  readModelName: string
  resolverName: string
  resolverArgs: any
  error: Error
}
export const queryReadModelFailure = (
  readModelName: string,
  resolverName: string,
  resolverArgs: any,
  error: Error
): QueryReadModelFailureAction => ({
  type: QUERY_READMODEL_FAILURE,
  readModelName,
  resolverName,
  resolverArgs,
  error
})

export type DropReadModelResultAction = {
  type: typeof DROP_READMODEL_STATE
  readModelName: string
  resolverName: string
  resolverArgs: any
}
export const dropReadModelResult = (
  readModelName: string,
  resolverName: string,
  resolverArgs: any
): DropReadModelResultAction => ({
  type: DROP_READMODEL_STATE,
  readModelName,
  resolverName,
  resolverArgs
})
