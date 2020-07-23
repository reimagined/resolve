import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { firstOfType } from 'resolve-core'
import { Command, CommandResult, CommandOptions } from 'resolve-client'
import { useCommand, CommandBuilder } from 'resolve-react-hooks'
import { isActionCreators, isDependencies, isOptions } from '../helpers'
import {
  SEND_COMMAND_REQUEST,
  SEND_COMMAND_FAILURE,
  SEND_COMMAND_SUCCESS
} from '../action-types'
import {
  SendCommandFailureAction,
  SendCommandRequestAction,
  SendCommandSuccessAction
} from './actions'

type HookData = {
  execute: () => void
}
type CommandReduxActionsCreators = {
  request: (command: Command) => SendCommandRequestAction
  success: (command: Command, result: CommandResult) => SendCommandSuccessAction
  failure: (command: Command, error: Error) => SendCommandFailureAction
}

const internalActions: CommandReduxActionsCreators = {
  request: (command: Command) => ({
    type: SEND_COMMAND_REQUEST,
    aggregateId: command.aggregateId,
    aggregateName: command.aggregateName,
    commandType: command.type,
    payload: command.payload
  }),
  success: (command: Command, result: CommandResult) => ({
    type: SEND_COMMAND_SUCCESS,
    aggregateId: command.aggregateId,
    aggregateName: command.aggregateName,
    commandType: command.type,
    payload: command.payload,
    result
  }),
  failure: (command: Command, error: Error) => ({
    type: SEND_COMMAND_FAILURE,
    aggregateId: command.aggregateId,
    aggregateName: command.aggregateName,
    commandType: command.type,
    payload: command.payload,
    error
  })
}

const defaultCommandOptions: CommandOptions = {}

function useReduxCommand(command: Command): HookData
function useReduxCommand(command: Command, options: CommandOptions): HookData
function useReduxCommand(
  command: Command,
  actions: CommandReduxActionsCreators
): HookData
function useReduxCommand(command: Command, dependencies: any[]): HookData
function useReduxCommand(
  command: Command,
  options: CommandOptions,
  actions: CommandReduxActionsCreators
): HookData
function useReduxCommand(
  command: Command,
  options: CommandOptions,
  dependencies: any[]
): HookData
function useReduxCommand(
  command: Command,
  options: CommandOptions,
  actions: CommandReduxActionsCreators,
  dependencies: any[]
): HookData
function useReduxCommand(
  command: Command,
  options?: CommandOptions | CommandReduxActionsCreators | any[],
  actions?: CommandReduxActionsCreators | any[],
  dependencies?: any[]
): HookData {
  const actualOptions: CommandOptions =
    firstOfType<CommandOptions>(isOptions, options) || defaultCommandOptions
  const actualActionCreators: CommandReduxActionsCreators =
    firstOfType<CommandReduxActionsCreators>(
      isActionCreators,
      options,
      actions
    ) || internalActions
  const actualDependencies: any[] =
    firstOfType<any[]>(isDependencies, options, actions, dependencies) ??
    [command, actualOptions, actualActionCreators].filter(i => i)

  const { request, success, failure } = actualActionCreators

  const dispatch = useDispatch()
  /*
  const executor = useCommand(
    command,
    actualOptions,
    (error, result) => {
      if (error || result == null) {
        if (typeof failure === 'function') {
          if (error) {
            dispatch(failure(command, error))
          } else {
            dispatch(failure(command, new Error(`null response`)))
          }
        }
      } else {
        if (typeof success === 'function') {
          dispatch(success(command, result))
        }
      }
    },
    actualDependencies
  )
  */




  return {
    execute: useCallback((): void => {
      if (typeof request === 'function') {
        dispatch(request(command))
      }
      executor()
    }, [actualDependencies])
  }
}

export { useReduxCommand }
