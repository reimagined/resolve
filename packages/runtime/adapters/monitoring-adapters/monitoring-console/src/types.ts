import { MonitoringAdapter } from '@resolve-js/core'

export interface MonitoringContext {
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
