import {
  Command,
  CommandResult,
  CommandOptions,
  CommandCallback,
  getClient
} from 'resolve-client'

import { useContext, useCallback } from 'react'
import { ResolveContext } from './context'

type CommandExecutor<TData> = (data: TData) => CommandResult | void
type CommandSuccessCallback = (result: CommandResult) => void
type CommandFailureCallback = (error: Error) => void
type CommandRequestCallback = (command: Command) => void
type CommandCallbacks = {
  request?: CommandRequestCallback
  failure?: CommandFailureCallback
  success?: CommandSuccessCallback
}

const isCommandCallbacks = (x: any): x is CommandCallbacks => {
  return (
    x &&
    (typeof x.request === 'function' ||
      typeof x.failure === 'function' ||
      typeof x.success === 'function')
  )
}
const isCommandOptions = (x: any): x is CommandOptions => {
  return x && typeof x === 'object'
}
const isDependencies = (x: any): x is any[] => {
  return x && x instanceof Array
}

function useCommand(command: Command): CommandExecutor<void>
function useCommand(
  command: Command,
  options: CommandOptions
): CommandExecutor<void>
function useCommand(
  command: Command,
  callbacks: CommandCallbacks
): CommandExecutor<void>
function useCommand(
  command: Command,
  dependencies: any[]
): CommandExecutor<void>
function useCommand(
  command: Command,
  options: CommandOptions,
  callbacks: CommandCallbacks
): CommandExecutor<void>
function useCommand(
  command: Command,
  options: CommandOptions,
  dependencies: any[]
): CommandExecutor<void>
function useCommand(
  command: Command,
  options: CommandOptions,
  callbacks: CommandCallbacks,
  dependencies: any[]
): CommandExecutor<void>

function useCommand(
  command: Command,
  optionsCallbacksOrDependencies?: CommandOptions | CommandCallbacks | any[],
  callbacksOrDependencies?: CommandCallbacks | any[],
  dependencies?: any[]
): CommandExecutor<void> {
  const context = useContext(ResolveContext)
  const client = getClient(context)

  let actualOptions: CommandOptions | undefined = undefined
  let actualCallbacks: CommandCallbacks = {}
  let actualDependencies: any[] = [command]

  if (isCommandOptions(optionsCallbacksOrDependencies)) {
    actualOptions = optionsCallbacksOrDependencies
    if (isCommandCallbacks(callbacksOrDependencies)) {
      actualCallbacks = callbacksOrDependencies
    }
    if (isDependencies(callbacksOrDependencies)) {
      actualDependencies = callbacksOrDependencies
    }
    if (isDependencies(dependencies)) {
      actualDependencies = dependencies
    }
  } else if (isCommandCallbacks(optionsCallbacksOrDependencies)) {
    actualCallbacks = optionsCallbacksOrDependencies
    if (isDependencies(callbacksOrDependencies)) {
      actualDependencies = callbacksOrDependencies
    }
  } else if (isDependencies(optionsCallbacksOrDependencies)) {
    actualDependencies = optionsCallbacksOrDependencies
  }

  return useCallback(async (): Promise<void> => {
    try {
      if (typeof actualCallbacks.request === 'function') {
        actualCallbacks.request(command)
      }

      const result = await client.command(command, actualOptions)

      if (typeof actualCallbacks.success === 'function') {
        actualCallbacks.success(result || {})
      }
    } catch (error) {
      if (typeof actualCallbacks.failure === 'function') {
        actualCallbacks.failure(error)
      }
    }
  }, [context, ...actualDependencies])
}

export { useCommand }
