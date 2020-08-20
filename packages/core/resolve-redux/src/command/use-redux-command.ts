import { useDispatch } from 'react-redux'
import { firstOfType } from 'resolve-core'
import {
  Command,
  CommandResult,
  CommandOptions,
  CommandCallback
} from 'resolve-client'
import { useCommand, CommandBuilder } from 'resolve-react-hooks'
import { isDependencies, isOptions } from '../helpers'
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

type CommandReduxHookOptions = {
  actions?: CommandReduxActionsCreators
  commandOptions?: CommandOptions
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
  options: CommandReduxHookOptions
): HookData<void>
function useReduxCommand(command: Command, dependencies: any[]): HookData<void>
function useReduxCommand(
  command: Command,
  options: CommandOptions,
  dependencies: any[]
): HookData<void>
function useReduxCommand<T>(builder: CommandBuilder<T>): HookData<T>
function useReduxCommand<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions
): HookData<T>
function useReduxCommand<T>(
  builder: CommandBuilder<T>,
  dependencies: any[]
): HookData<T>
function useReduxCommand<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions,
  dependencies: any[]
): HookData<T>
function useReduxCommand<T>(
  command: Command | CommandBuilder<T>,
  options?: CommandReduxHookOptions | any[],
  dependencies?: any[]
): HookData<T> {
  const actualOptions = isOptions<CommandReduxHookOptions>(options)
    ? options
    : {}

  const actualActionCreators: CommandReduxActionsCreators =
    actualOptions.actions || internalActions

  const actualDependencies: any[] =
    firstOfType<any[]>(isDependencies, options, dependencies, dependencies) ??
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
    actualOptions.commandOptions || defaultCommandOptions,
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
