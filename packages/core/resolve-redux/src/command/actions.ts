import {
  SEND_COMMAND_FAILURE,
  SEND_COMMAND_REQUEST,
  SEND_COMMAND_SUCCESS
} from '../action-types'

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

export type SendCommandSuccessAction = {
  type: typeof SEND_COMMAND_SUCCESS
  commandType: string
  aggregateId: string
  aggregateName: string
  payload: any
  result: any
}
export const sendCommandSuccess = (
  commandType: string,
  aggregateId: string,
  aggregateName: string,
  payload: any,
  result: any
): SendCommandSuccessAction => ({
  type: SEND_COMMAND_SUCCESS,
  commandType,
  aggregateId,
  aggregateName,
  payload,
  result
})

export type SendCommandFailureAction = {
  type: typeof SEND_COMMAND_FAILURE
  commandType: string
  aggregateId: string
  aggregateName: string
  payload: any
  error: any
}
export const sendCommandFailure = (
  commandType: string,
  aggregateId: string,
  aggregateName: string,
  payload: any,
  error: Error
): SendCommandFailureAction => ({
  type: SEND_COMMAND_FAILURE,
  commandType,
  aggregateId,
  aggregateName,
  payload,
  error
})
