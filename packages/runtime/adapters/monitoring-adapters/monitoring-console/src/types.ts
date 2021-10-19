import createBaseMonitoring from '@resolve-js/monitoring-base'

export interface MonitoringContext {
  baseMonitoring: ReturnType<typeof createBaseMonitoring>
}
