import { LeveledDebugger } from '@resolve-js/debug-levels'
import createBaseMonitoring from '@resolve-js/monitoring-base'
import debugLevels from '@resolve-js/debug-levels'

import type { MonitoringContext } from './types'

import { monitoringPublish } from './publish'

const createMonitoringImplementation = (
  log: LeveledDebugger,
  monitoringContext: MonitoringContext
) => {
  return {
    group: (config: Record<string, string>) =>
      createMonitoringImplementation(log, {
        ...monitoringContext,
        monitoringBase: monitoringContext.monitoringBase.group(config),
      }),
    error: monitoringContext.monitoringBase.error,
    execution: monitoringContext.monitoringBase.execution,
    duration: monitoringContext.monitoringBase.duration,
    time: monitoringContext.monitoringBase.time,
    timeEnd: monitoringContext.monitoringBase.timeEnd,
    rate: monitoringContext.monitoringBase.rate,
    publish: monitoringPublish.bind(null, log, monitoringContext),
  }
}

const createMonitoring = ({
  deploymentId,
  resolveVersion,
}: {
  deploymentId: string
  resolveVersion: string
}) => {
  const monitoringContext: MonitoringContext = {
    deploymentId,
    resolveVersion,
    // TODO: any
    monitoringBase: (createBaseMonitoring as any)({
      getTimestamp: () => {
        const value = Date.now()
        return value - (value % 1000)
      },
    }),
  }

  return createMonitoringImplementation(
    debugLevels('resolve:monitoring-aws-cloudwatch'),
    monitoringContext
  )
}

export default createMonitoring
