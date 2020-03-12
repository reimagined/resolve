import {
  Command,
  CommandResult,
  CommandOptions,
  CommandCallback,
  getClient
} from 'resolve-client'
import { useContext, useCallback } from 'react'
import { ResolveContext } from './context'
import {
  firstOfType,
  HookExecutor,
  isCallback,
  isDependencies,
  isOptions
} from './generic'

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
  const context = useContext(ResolveContext)
  if (!context) {
    throw Error('You cannot use reSolve hooks outside Resolve context')
  }

  const client = getClient(context)

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
    [context, ...actualDependencies]
  )
}

export { useCommand }
