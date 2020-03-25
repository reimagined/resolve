import { useCallback } from 'react'
import {
  Command,
  CommandCallback,
  CommandOptions,
  CommandResult
} from 'resolve-client'
import { useClient } from './use_client'
import {
  firstOfType,
  HookExecutor,
  isCallback,
  isDependencies,
  isOptions
} from './generic'

export type CommandBuilder = (...args: any[]) => Command

type CommandExecutor = HookExecutor<any[], CommandResult>

function useCommandBuilder(builder: CommandBuilder): CommandExecutor
function useCommandBuilder(
  builder: CommandBuilder,
  options: CommandOptions
): CommandExecutor
function useCommandBuilder(
  builder: CommandBuilder,
  callback: CommandCallback
): CommandExecutor
function useCommandBuilder(
  builder: CommandBuilder,
  dependencies: any[]
): CommandExecutor
function useCommandBuilder(
  builder: CommandBuilder,
  callback: CommandCallback,
  dependencies: any[]
): CommandExecutor
function useCommandBuilder(
  builder: CommandBuilder,
  options: CommandOptions,
  callback: CommandCallback
): CommandExecutor
function useCommandBuilder(
  builder: CommandBuilder,
  options: CommandOptions,
  dependencies: any[]
): CommandExecutor
function useCommandBuilder(
  builder: CommandBuilder,
  options: CommandOptions,
  callback: CommandCallback,
  dependencies: any[]
): CommandExecutor

function useCommandBuilder(
  builder: CommandBuilder,
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
    [builder, actualOptions, actualCallback].filter(i => i)

  return useCallback(
    (...args: any[]): Promise<CommandResult> | void =>
      client.command(builder(...args), actualOptions, actualCallback),
    [client, ...actualDependencies]
  )
}

export { useCommandBuilder }
