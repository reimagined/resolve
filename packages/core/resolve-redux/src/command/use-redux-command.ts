import { useDispatch } from 'react-redux'
import { firstOfType } from 'resolve-core'
import {
  Command,
  CommandResult,
  CommandOptions,
  CommandCallback
} from 'resolve-client'
import { useCommand, CommandBuilder } from 'resolve-react-hooks'
import { isActionCreators, isDependencies, isOptions } from '../helpers'
import {
  sendCommandFailure,
  SendCommandFailureAction,
  sendCommandRequest,
  SendCommandRequestAction,
  sendCommandSuccess,
  SendCommandSuccessAction
} from './actions'

type HookData<T> = {
  execute: (data: T) => void
}
type CommandReduxActionsCreators = {
  request: (command: Command) => SendCommandRequestAction
  success: (command: Command, result: CommandResult) => SendCommandSuccessAction
  failure: (command: Command, error: Error) => SendCommandFailureAction
}

const internalActions: CommandReduxActionsCreators = {
  request: (command: Command) => sendCommandRequest(command, true),
  success: sendCommandSuccess,
  failure: sendCommandFailure
}

const defaultCommandOptions: CommandOptions = {}

function useReduxCommand(command: Command): HookData<void>
function useReduxCommand(
  command: Command,
  options: CommandOptions
): HookData<void>
function useReduxCommand(
  command: Command,
  actions: CommandReduxActionsCreators
): HookData<void>
function useReduxCommand(command: Command, dependencies: any[]): HookData<void>
function useReduxCommand(
  command: Command,
  options: CommandOptions,
  actions: CommandReduxActionsCreators
): HookData<void>
function useReduxCommand(
  command: Command,
  options: CommandOptions,
  dependencies: any[]
): HookData<void>
function useReduxCommand(
  command: Command,
  options: CommandOptions,
  actions: CommandReduxActionsCreators,
  dependencies: any[]
): HookData<void>
function useReduxCommand<T>(builder: CommandBuilder<T>): HookData<T>
function useReduxCommand<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions
): HookData<T>
function useReduxCommand<T>(
  builder: CommandBuilder<T>,
  actions: CommandReduxActionsCreators
): HookData<T>
function useReduxCommand<T>(
  builder: CommandBuilder<T>,
  dependencies: any[]
): HookData<T>
function useReduxCommand<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions,
  actions: CommandReduxActionsCreators
): HookData<T>
function useReduxCommand<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions,
  dependencies: any[]
): HookData<T>
function useReduxCommand<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions,
  actions: CommandReduxActionsCreators,
  dependencies: any[]
): HookData<T>
function useReduxCommand<T>(
  command: Command | CommandBuilder<T>,
  options?: CommandOptions | CommandReduxActionsCreators | any[],
  actions?: CommandReduxActionsCreators | any[],
  dependencies?: any[]
): HookData<T> {
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

  const callback: CommandCallback = (error, result, executedCommand) => {
    if (error || result == null) {
      if (typeof failure === 'function') {
        if (error) {
          dispatch(failure(executedCommand, error))
        } else {
          dispatch(failure(executedCommand, new Error(`null response`)))
        }
      }
    } else {
      if (typeof success === 'function') {
        dispatch(success(executedCommand, result))
      }
    }
  }

  const dispatch = useDispatch()
  const executor = useCommand(
    (command: Command) => command,
    actualOptions,
    callback,
    actualDependencies
  )

  return {
    execute: (data: T): void => {
      const dispatchRequest = (command: Command): void => {
        if (typeof request === 'function') {
          dispatch(request(command))
        }
      }

      const plainCommand: Command =
        typeof command === 'function' ? command(data) : command

      dispatchRequest(plainCommand)
      executor(plainCommand)
    }
  }
}

export { useReduxCommand }
