import { Command } from '@resolve-js/client'
import {
  SEND_COMMAND_FAILURE,
  SEND_COMMAND_REQUEST,
  SEND_COMMAND_SUCCESS,
} from '../internal/action-types'

export type CommandAction = {
  type: string
  command: Command
}

export type SendCommandRequestAction = {
  type: typeof SEND_COMMAND_REQUEST
  usedByHook: boolean
} & CommandAction
export const sendCommandRequest = (
  command: Command,
  usedByHook: boolean
): SendCommandRequestAction => ({
  type: SEND_COMMAND_REQUEST,
  command,
  usedByHook,
})

export type SendCommandSuccessAction = {
  type: typeof SEND_COMMAND_SUCCESS
  result: any
} & CommandAction
export const sendCommandSuccess = (
  command: Command,
  result: any
): SendCommandSuccessAction => ({
  type: SEND_COMMAND_SUCCESS,
  command,
  result,
})

export type SendCommandFailureAction = {
  type: typeof SEND_COMMAND_FAILURE
  error: any
} & CommandAction
export const sendCommandFailure = (
  command: Command,
  error: Error
): SendCommandFailureAction => ({
  type: SEND_COMMAND_FAILURE,
  command,
  error,
})
