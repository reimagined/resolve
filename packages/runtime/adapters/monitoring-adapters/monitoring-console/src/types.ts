import { MonitoringAdapter } from '@resolve-js/core'

export type PublishMode = 'all' | 'processExit' | 'resolveDispose'

export interface MonitoringContext {
  baseMonitoring: MonitoringAdapter
  publishMode: PublishMode
}

export interface MonitoringGroupContext {
  baseMonitoring: MonitoringAdapter
}

export interface MetricSummary {
  sum: number
  count: number
  min: number
  max: number
}

export interface MetricGroupItem {
  label: string
  values: number[]
  counts: number[]
}

export interface MetricsGroup {
  metricName: string
  unit: string
  metrics: MetricGroupItem[]
}
