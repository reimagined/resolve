import {
  Command,
  CommandResult,
  CommandOptions,
  CommandCallback
} from 'resolve-client'
import { useCallback } from 'react'
import {
  firstOfType,
  HookExecutor,
  isCallback,
  isDependencies,
  isOptions
} from './generic'
import { useClient } from './use-client'

type CommandExecutor = HookExecutor<void, CommandResult>

function useCommand(command: Command): CommandExecutor
function useCommand(command: Command, options: CommandOptions): CommandExecutor
function useCommand(
  command: Command,
  callback: CommandCallback
): CommandExecutor
function useCommand(command: Command, dependencies: any[]): CommandExecutor
function useCommand(
  command: Command,
  callback: CommandCallback,
  dependencies: any[]
): CommandExecutor
function useCommand(
  command: Command,
  options: CommandOptions,
  callback: CommandCallback
): CommandExecutor
function useCommand(
  command: Command,
  options: CommandOptions,
  dependencies: any[]
): CommandExecutor
function useCommand(
  command: Command,
  options: CommandOptions,
  callback: CommandCallback,
  dependencies: any[]
): CommandExecutor

function useCommand(
  command: Command,
  options?: CommandOptions | CommandCallback | any[],
  callback?: CommandCallback | any[],
  dependencies?: any[]
): CommandExecutor {
  const client = useClient()

  const actualOptions: CommandOptions | undefined = firstOfType<CommandOptions>(
    isOptions,
    options
  )
  const actualCallback: CommandCallback | undefined = firstOfType<
    CommandCallback
  >(isCallback, options, callback)
  const actualDependencies: any[] =
    firstOfType<any[]>(isDependencies, options, callback, dependencies) ??
    [command, actualOptions, actualCallback].filter(i => i)

  return useCallback(
    (): Promise<CommandResult> | void =>
      client.command(command, actualOptions, actualCallback),
    [client, ...actualDependencies]
  )
}

export { useCommand }
