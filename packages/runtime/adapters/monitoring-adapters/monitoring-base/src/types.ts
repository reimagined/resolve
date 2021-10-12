export interface MonitoringDimension {
  name: string
  value: string
}

export interface MonitoringMetric {
  metricName: string
  dimensions: MonitoringDimension[]
  timestamp: number | null
  values: number[]
  counts: number[]
  unit: string
}

export interface MonitoringContext {
  getTimestamp: () => number | null
  metrics: MonitoringMetric[]
}

export interface MonitoringGroupContext {
  dimensions: MonitoringDimension[]
  timerMap: Record<string, number>
}
