import {
  Command,
  InteropCommandResult,
  AggregatesInterop,
  CommandError,
  MiddlewareContext,
  PerformanceTracer,
  CommandExecutor,
} from '@resolve-js/core'

type CommandPool = {
  performanceTracer?: PerformanceTracer | null
  isDisposed: boolean
}

export type { CommandExecutor }

export type CommandExecutorBuilder = (context: {
  performanceTracer?: PerformanceTracer | null
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

export const createCommandExecutor: CommandExecutorBuilder = ({
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
  ): Promise<InteropCommandResult> => {
    if (pool.isDisposed) {
      throw new CommandError('Command handler is disposed')
    }
    return await aggregatesInterop.executeCommand(command, middlewareContext)
  }

  const api = {
    executeCommand: disposableExecutor,
    dispose: dispose.bind(null, pool),
  }

  const commandExecutor = disposableExecutor.bind(null)
  Object.assign(commandExecutor, api)

  return commandExecutor as CommandExecutor
}
