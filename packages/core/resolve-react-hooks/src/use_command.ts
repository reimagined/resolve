import {
  Command,
  CommandResult,
  CommandOptions,
  CommandCallback,
  getClient
} from 'resolve-client'
import { useContext, useCallback } from 'react'
import { ResolveContext } from './context'

export type CommandExecutor<TData> = (data: TData) => CommandResult | void

const isCallback = (x: any): x is CommandCallback => {
  return x && typeof x === 'function'
}
const isOptions = (x: any): x is CommandOptions => {
  return x && typeof x === 'object' && !(x instanceof Array)
}
const isDependencies = (x: any): x is any[] => {
  return x && x instanceof Array
}
function firstOfType<T>(selector: Function, ...vars: any[]): T | undefined {
  return vars.find(i => selector(i)) as T
}

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

function useCommand(
  command: Command,
  options?: CommandOptions | CommandCallback | any[],
  callback?: CommandCallback | any[],
  dependencies?: any[]
): CommandExecutor<void> {
  const context = useContext(ResolveContext)
  const client = getClient(context)

  const actualOptions: CommandOptions | undefined = firstOfType<CommandOptions>(
    isOptions,
    options
  )
  const actualCallback: CommandCallback | undefined = firstOfType<
    CommandCallback
  >(isCallback, options, callback)
  const actualDependencies: any[] = firstOfType<any[]>(
    isDependencies,
    options,
    callback,
    dependencies
  ) ?? [command]

  return useCallback(
    (): Promise<CommandResult> | void =>
      client.command(command, actualOptions, actualCallback),
    [context, ...actualDependencies]
  )
}

export { useCommand }
