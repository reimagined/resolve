import {
  Command,
  CommandResult,
  CommandOptions,
  CommandCallback,
} from 'resolve-client'
import { useCallback } from 'react'
import { HookExecutor, isCallback, isDependencies, isOptions } from './generic'
import { useClient } from './use-client'
import { firstOfType } from 'resolve-core'

export type CommandBuilder<T> = (data: T) => Command
export type CommandExecutor<T> = HookExecutor<T, CommandResult>

function useCommand(command: Command): CommandExecutor<void>
function useCommand(
  command: Command,
  options: CommandOptions
): CommandExecutor<void>
function useCommand(
  command: Command,
  callback: CommandCallback
): CommandExecutor<void>
function useCommand(
  command: Command,
  dependencies: any[]
): CommandExecutor<void>
function useCommand(
  command: Command,
  callback: CommandCallback,
  dependencies: any[]
): CommandExecutor<void>
function useCommand(
  command: Command,
  options: CommandOptions,
  callback: CommandCallback
): CommandExecutor<void>
function useCommand(
  command: Command,
  options: CommandOptions,
  dependencies: any[]
): CommandExecutor<void>
function useCommand(
  command: Command,
  options: CommandOptions,
  callback: CommandCallback,
  dependencies: any[]
): CommandExecutor<void>
function useCommand<T>(builder: CommandBuilder<T>): CommandExecutor<T>
function useCommand<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions
): CommandExecutor<T>
function useCommand<T>(
  builder: CommandBuilder<T>,
  callback: CommandCallback
): CommandExecutor<T>
function useCommand<T>(
  builder: CommandBuilder<T>,
  dependencies: any[]
): CommandExecutor<T>
function useCommand<T>(
  builder: CommandBuilder<T>,
  callback: CommandCallback,
  dependencies: any[]
): CommandExecutor<T>
function useCommand<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions,
  callback: CommandCallback
): CommandExecutor<T>
function useCommand<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions,
  dependencies: any[]
): CommandExecutor<T>
function useCommand<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions,
  callback: CommandCallback,
  dependencies: any[]
): CommandExecutor<T>
function useCommand<T>(
  command: Command | CommandBuilder<T>,
  options?: CommandOptions | CommandCallback | any[],
  callback?: CommandCallback | any[],
  dependencies?: any[]
): CommandExecutor<T> {
  const client = useClient()

  const actualOptions: CommandOptions | undefined = firstOfType<CommandOptions>(
    isOptions,
    options
  )
  const actualCallback: CommandCallback | undefined = firstOfType<
    CommandCallback
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
        (data: T): Promise<CommandResult> | void => {
          return client.command(command(data), actualOptions, actualCallback)
        },
        [client, ...actualDependencies]
      )
    }
    return (data: T): Promise<CommandResult> | void =>
      client.command(command(data), actualOptions, actualCallback)
  }
  if (isDependencies(actualDependencies)) {
    return useCallback((): Promise<CommandResult> | void => {
      return client.command(command, actualOptions, actualCallback)
    }, [client, ...actualDependencies])
  }
  return () => client.command(command, actualOptions, actualCallback)
}

export { useCommand }
