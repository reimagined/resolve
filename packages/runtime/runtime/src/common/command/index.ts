import {
  Command,
  CommandResult,
  AggregatesInterop,
  CommandError,
  MiddlewareContext,
} from '@resolve-js/core'

type CommandPool = {
  performanceTracer: any
  isDisposed: boolean
}

export type CommandExecutor = {
  (command: Command): Promise<CommandResult>
  dispose: () => Promise<void>
}

export type CommandExecutorBuilder = (context: {
  performanceTracer?: any
  aggregatesInterop: AggregatesInterop
}) => CommandExecutor

const dispose = async (pool: CommandPool): Promise<void> => {
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment('dispose') : null

  try {
    if (pool.isDisposed) {
      throw new CommandError('Command handler is disposed')
    }

    pool.isDisposed = true
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }
    throw error
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const createCommand: CommandExecutorBuilder = ({
  performanceTracer,
  aggregatesInterop,
}): CommandExecutor => {
  const pool = {
    isDisposed: false,
    performanceTracer,
  }

  const disposableExecutor = async (
    command: Command,
    middlewareContext: MiddlewareContext
  ): Promise<CommandResult | null> => {
    if (pool.isDisposed) {
      throw new CommandError('Command handler is disposed')
    }
    return await aggregatesInterop.executeCommand(command, middlewareContext)
  }

  const api = {
    executeCommand: disposableExecutor,
    dispose: dispose.bind(null, pool as any),
  }

  const commandExecutor = disposableExecutor.bind(null)
  Object.assign(commandExecutor, api)

  return commandExecutor as CommandExecutor
}

export default createCommand
