import createBaseMonitoring from '@resolve-js/monitoring-base'
import getLog, { LeveledDebugger } from '@resolve-js/debug-levels'

import { monitoringPublish } from './publish'
import type { MonitoringContext } from './types'

const createMonitoringImplementation = (
  log: LeveledDebugger,
  context: MonitoringContext,
  { baseMonitoring }: MonitoringContext
) => ({
  group: (config: Record<string, string>) =>
    createMonitoringImplementation(log, context, {
      baseMonitoring: baseMonitoring.group(config),
    }),
  duration: baseMonitoring.duration.bind(baseMonitoring),
  error: baseMonitoring.error.bind(baseMonitoring),
  time: baseMonitoring.time.bind(baseMonitoring),
  timeEnd: baseMonitoring.timeEnd.bind(baseMonitoring),
  publish: monitoringPublish.bind(null, log, context),
  execution: baseMonitoring.execution.bind(baseMonitoring),
  rate: baseMonitoring.rate.bind(baseMonitoring),
  getMetrics: baseMonitoring.getMetrics.bind(baseMonitoring),
  clearMetrics: baseMonitoring.clearMetrics.bind(baseMonitoring),
})

const createMonitoring = () => {
  const baseMonitoring = createBaseMonitoring()

  return createMonitoringImplementation(
    getLog('resolve:monitoring-console'),
    { baseMonitoring },
    { baseMonitoring }
  )
}

export default createMonitoring
