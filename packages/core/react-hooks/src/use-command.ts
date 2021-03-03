import {
  Command,
  CommandResult,
  CommandOptions,
  CommandCallback,
} from '@resolve-js/client'
import { useCallback } from 'react'
import { HookExecutor, isCallback, isDependencies, isOptions } from './generic'
import { useClient } from './use-client'
import { firstOfType } from '@resolve-js/core'

export type CommandBuilder<TArgs extends any[], TCmd extends Command> = (
  ...data: TArgs
) => TCmd
export type CommandExecutor<TArgs extends any[]> = HookExecutor<
  TArgs,
  CommandResult
>

function useCommand<TCmd extends Command>(
  command: TCmd
): CommandExecutor<void[]>
function useCommand<TCmd extends Command>(
  command: TCmd,
  options: CommandOptions
): CommandExecutor<void[]>
function useCommand<TCmd extends Command>(
  command: TCmd,
  callback: CommandCallback<TCmd>
): CommandExecutor<void[]>
function useCommand<TCmd extends Command>(
  command: TCmd,
  dependencies: any[]
): CommandExecutor<void[]>
function useCommand<TCmd extends Command>(
  command: TCmd,
  callback: CommandCallback<TCmd>,
  dependencies: any[]
): CommandExecutor<void[]>
function useCommand<TCmd extends Command>(
  command: TCmd,
  options: CommandOptions,
  callback: CommandCallback<TCmd>
): CommandExecutor<void[]>
function useCommand<TCmd extends Command>(
  command: TCmd,
  options: CommandOptions,
  dependencies: any[]
): CommandExecutor<void[]>
function useCommand<TCmd extends Command>(
  command: TCmd,
  options: CommandOptions,
  callback: CommandCallback<TCmd>,
  dependencies: any[]
): CommandExecutor<void[]>
function useCommand<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>
): CommandExecutor<TArgs>
function useCommand<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  options: CommandOptions
): CommandExecutor<TArgs>
function useCommand<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  callback: CommandCallback<TCmd>
): CommandExecutor<TArgs>
function useCommand<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  dependencies: any[]
): CommandExecutor<TArgs>
function useCommand<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  callback: CommandCallback<TCmd>,
  dependencies: any[]
): CommandExecutor<TArgs>
function useCommand<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  options: CommandOptions,
  callback: CommandCallback<TCmd>
): CommandExecutor<TArgs>
function useCommand<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  options: CommandOptions,
  dependencies: any[]
): CommandExecutor<TArgs>
function useCommand<TArgs extends any[], TCmd extends Command>(
  builder: CommandBuilder<TArgs, TCmd>,
  options: CommandOptions,
  callback: CommandCallback<TCmd>,
  dependencies: any[]
): CommandExecutor<TArgs>
function useCommand<TArgs extends any[], TCmd extends Command>(
  command: Command | CommandBuilder<TArgs, TCmd>,
  options?: CommandOptions | CommandCallback<TCmd> | any[],
  callback?: CommandCallback<TCmd> | any[],
  dependencies?: any[]
): CommandExecutor<TArgs> {
  const client = useClient()

  const actualOptions: CommandOptions | undefined = firstOfType<CommandOptions>(
    isOptions,
    options
  )
  const actualCallback: CommandCallback<Command> | undefined = firstOfType<
    CommandCallback<Command>
  >(isCallback, options, callback)
  const actualDependencies = firstOfType<any[]>(
    isDependencies,
    options,
    callback,
    dependencies
  )

  if (typeof command === 'function') {
    if (isDependencies(actualDependencies)) {
      return useCallback(
        (...data: TArgs): Promise<CommandResult> | void => {
          return client.command(command(...data), actualOptions, actualCallback)
        },
        [client, ...actualDependencies]
      )
    }
    return (...data: TArgs): Promise<CommandResult> | void =>
      client.command(command(...data), actualOptions, actualCallback)
  }
  if (isDependencies(actualDependencies)) {
    return useCallback((): Promise<CommandResult> | void => {
      return client.command(command, actualOptions, actualCallback)
    }, [client, ...actualDependencies])
  }
  return () => client.command(command, actualOptions, actualCallback)
}

export { useCommand }
