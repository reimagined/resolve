import type { MonitoringAdapter } from '@resolve-js/core'

export interface MonitoringContext {
  monitoringBase: MonitoringAdapter
  deploymentId: string
  resolveVersion: string
}

export interface CloudWatchMetricDatum {
  MetricName: string
  Unit: string
  Dimensions: Array<{
    Name: string
    Value: string
  }>
  Values: number[]
  Counts: number[]
  Timestamp: Date
}
