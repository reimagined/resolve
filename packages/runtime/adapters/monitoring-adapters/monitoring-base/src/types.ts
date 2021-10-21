import type { MonitoringMetric, MonitoringDimension } from '@resolve-js/core'

export interface MonitoringContext {
  getTimestamp: () => number | null
  metrics: MonitoringMetric[]
}

export interface MonitoringGroupContext {
  dimensions: MonitoringDimension[]
  timerMap: Record<string, number>
}
