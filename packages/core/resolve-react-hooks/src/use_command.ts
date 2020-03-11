import {
  Command,
  CommandResult,
  CommandOptions,
  CommandCallback,
  getApi
} from 'resolve-client'

import { useContext, useCallback, useDebugValue } from 'react'
import { ResolveContext } from './context'

type CommandBuilder<TData> = (data: TData) => Command
type CommandExecutor<TData> = (data: TData) => CommandResult | void

function isCommandBuilder<T>(x: any): x is CommandBuilder<T> {
  return x !== null && x !== undefined && typeof x === 'function'
}

function useCommand(
  input: Command,
  options?: CommandOptions
): CommandExecutor<void>

function useCommand<T>(
  input: CommandBuilder<T>,
  options?: CommandOptions | CommandCallback,
  callback?: CommandCallback,
  dependencies?: any[]
): CommandExecutor<T>

function useCommand<T>(
  input: Command | CommandBuilder<T>,
  options?: CommandOptions | CommandCallback,
  callback?: CommandCallback,
  dependencies: any[] = []
): CommandExecutor<T> {
  const context = useContext(ResolveContext)
  const actualDependencies = isCommandBuilder<T>(input)
    ? dependencies || []
    : [input]
  const api = getApi(context)

  const executor = useCallback(
    (data: T): Promise<CommandResult> | void => {
      const command = isCommandBuilder<T>(input) ? input(data) : input

      return api.command(command, options, callback)
    },
    [context, ...actualDependencies]
  )

  useDebugValue(
    `${isCommandBuilder<T>(input) ? 'command builder' : 'command object'}`
  )

  return executor
}

export { useCommand }
