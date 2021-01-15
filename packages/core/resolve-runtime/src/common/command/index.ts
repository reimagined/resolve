import { Command, CommandResult, AggregatesInterop } from 'resolve-core'

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

// eslint-disable-next-line no-new-func
const CommandError = Function()
Object.setPrototypeOf(CommandError.prototype, Error.prototype)
export { CommandError }

const generateCommandError = (message: string): Error => {
  const error = new Error(message)
  Object.setPrototypeOf(error, CommandError.prototype)
  Object.defineProperties(error, {
    name: { value: 'CommandError', enumerable: true },
    message: { value: error.message, enumerable: true },
    stack: { value: error.stack, enumerable: true },
  })
  return error
}

const dispose = async (pool: CommandPool): Promise<void> => {
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment('dispose') : null

  try {
    if (pool.isDisposed) {
      throw generateCommandError('Command handler is disposed')
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

  const disposableExecutor = (command: Command): Promise<CommandResult> => {
    if (pool.isDisposed) {
      throw generateCommandError('Command handler is disposed')
    }
    return aggregatesInterop.executeCommand(command)
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
