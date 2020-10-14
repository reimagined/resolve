import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { firstOfType } from 'resolve-core'
import {
  Command,
  CommandResult,
  CommandOptions,
  CommandCallback,
} from 'resolve-client'
import { useCommandBuilder, CommandBuilder } from 'resolve-react-hooks'
import { isDependencies, isOptions } from '../helpers'
import {
  sendCommandFailure,
  SendCommandFailureAction,
  sendCommandRequest,
  SendCommandRequestAction,
  sendCommandSuccess,
  SendCommandSuccessAction,
} from './actions'
import { AnyAction } from 'redux'

type HookData<TArgs extends any[]> = {
  execute: (...data: TArgs) => void
}
type CommandReduxActionsCreators = {
  request?: (command: Command) => SendCommandRequestAction | AnyAction
  success?: (
    command: Command,
    result: CommandResult
  ) => SendCommandSuccessAction | AnyAction
  failure?: (
    command: Command,
    error: Error
  ) => SendCommandFailureAction | AnyAction
}

export type CommandReduxHookOptions<TCmd extends Command> = {
  actions?: CommandReduxActionsCreators
  commandOptions?: CommandOptions
}

const internalActions: CommandReduxActionsCreators = {
  request: (command: Command) => sendCommandRequest(command, true),
  success: sendCommandSuccess,
  failure: sendCommandFailure,
}

const defaultCommandOptions: CommandOptions = {}
const defaultHookOptions: CommandReduxHookOptions<Command> = {}

function useReduxCommand<TCmd extends Command>(command: TCmd): HookData<void[]>
function useReduxCommand<TCmd extends Command>(
  command: TCmd,
  options: CommandReduxHookOptions<TCmd>
): HookData<void[]>
function useReduxCommand<TCmd extends Command>(
  command: TCmd,
  dependencies: any[]
): HookData<void[]>
function useReduxCommand<TCmd extends Command>(
  command: TCmd,
  options: CommandReduxHookOptions<TCmd>,
  dependencies: any[]
): HookData<void[]>
function useReduxCommand<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>
): HookData<TArgs>
function useReduxCommand<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  options: CommandReduxHookOptions<TCmd>
): HookData<TArgs>
function useReduxCommand<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  dependencies: any[]
): HookData<TArgs>
function useReduxCommand<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  options: CommandReduxHookOptions<TCmd>,
  dependencies: any[]
): HookData<TArgs>
function useReduxCommand<TArgs extends any[], TCmd extends Command>(
  command: TCmd | CommandBuilder<TArgs, TCmd>,
  options?: CommandReduxHookOptions<TCmd> | any[],
  dependencies?: any[]
): HookData<TArgs> {
  const actualOptions = isOptions<CommandReduxHookOptions<TCmd>>(options)
    ? options
    : defaultHookOptions

  const actualActionCreators = actualOptions.actions || internalActions

  const actualDependencies = firstOfType<any[]>(
    isDependencies,
    options,
    dependencies
  )

  const { request, success, failure } = actualActionCreators

  const callback: CommandCallback<TCmd> = (error, result, executedCommand) => {
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
  const executor = actualDependencies
    ? useCommandBuilder(
        (command: TCmd) => command,
        actualOptions.commandOptions || defaultCommandOptions,
        callback,
        actualDependencies
      )
    : useCommandBuilder(
        (command: TCmd) => command,
        actualOptions.commandOptions || defaultCommandOptions,
        callback
      )

  return useMemo(
    () => ({
      execute: (...data: TArgs): void => {
        const dispatchRequest = (command: Command): void => {
          if (typeof request === 'function') {
            dispatch(request(command))
          }
        }

        const plainCommand: TCmd =
          typeof command === 'function' ? command(...data) : command

        dispatchRequest(plainCommand)
        executor(plainCommand)
      },
    }),
    [executor, dispatch]
  )
}

export { useReduxCommand }
