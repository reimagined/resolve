import { useCallback } from 'react'
import {
  Command,
  CommandCallback,
  CommandOptions,
  CommandResult
} from 'resolve-client'
import { useClient } from './use-client'
import {
  HookExecutor,
  isCallback,
  isDependencies,
  isOptions
} from './generic'
import { firstOfType } from 'resolve-core'

export type CommandBuilder<T> = (data: T) => Command

type CommandExecutor<T> = HookExecutor<T, CommandResult>

function useCommandBuilder<T>(builder: CommandBuilder<T>): CommandExecutor<T>
function useCommandBuilder<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions
): CommandExecutor<T>
function useCommandBuilder<T>(
  builder: CommandBuilder<T>,
  callback: CommandCallback
): CommandExecutor<T>
function useCommandBuilder<T>(
  builder: CommandBuilder<T>,
  dependencies: any[]
): CommandExecutor<T>
function useCommandBuilder<T>(
  builder: CommandBuilder<T>,
  callback: CommandCallback,
  dependencies: any[]
): CommandExecutor<T>
function useCommandBuilder<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions,
  callback: CommandCallback
): CommandExecutor<T>
function useCommandBuilder<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions,
  dependencies: any[]
): CommandExecutor<T>
function useCommandBuilder<T>(
  builder: CommandBuilder<T>,
  options: CommandOptions,
  callback: CommandCallback,
  dependencies: any[]
): CommandExecutor<T>

function useCommandBuilder<T>(
  builder: CommandBuilder<T>,
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
  const actualDependencies: any[] =
    firstOfType<any[]>(isDependencies, options, callback, dependencies) ??
    [builder, actualOptions, actualCallback].filter(i => i)

  return useCallback(
    (data: T): Promise<CommandResult> | void =>
      client.command(builder(data), actualOptions, actualCallback),
    [client, ...actualDependencies]
  )
}

export { useCommandBuilder }
