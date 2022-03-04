import {
  AggregatesInterop,
  PerformanceTracer,
  CommandExecutor,
} from '@resolve-js/core'

export type { CommandExecutor }

export type CommandExecutorBuilder = (context: {
  performanceTracer?: PerformanceTracer | null
  aggregatesInterop: AggregatesInterop
}) => CommandExecutor

export const createCommandExecutor: CommandExecutorBuilder = ({
  performanceTracer,
  aggregatesInterop,
}): CommandExecutor => {
  const executor = aggregatesInterop.executeCommand.bind(aggregatesInterop)
  Object.assign(executor, { executeCommand: executor })

  return executor as CommandExecutor
}
