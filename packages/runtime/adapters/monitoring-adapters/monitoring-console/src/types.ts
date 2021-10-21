import createBaseMonitoring from '@resolve-js/monitoring-base'

export interface MonitoringContext {
  baseMonitoring: ReturnType<typeof createBaseMonitoring>
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
