// TODO: move to base
export interface MonitoringDimension {
  name: string
  value: string
}

export type MonitoringDimensions = MonitoringDimension[]
export type MonitoringDimensionsList = MonitoringDimensions[]

// TODO: move to base
export interface MonitoringMetric {
  metricName: string
  dimensions: MonitoringDimension[]
  timestamp: Date
  values: number[]
  counts: number[]
  unit: string
}

// TODO: any
export interface MonitoringContext {
  monitoringBase: any
  deploymentId: string
  resolveVersion: string
}

// TODO: move to base
export interface MonitoringData {
  metrics: MonitoringMetric[]
}

export interface MonitoringGroupData {
  timerMap: Record<string, number>
  metricDimensions: MonitoringDimensions
  globalDimensions: MonitoringDimensionsList
  durationMetricDimensionsList: MonitoringDimensionsList
  errorMetricDimensionsList: MonitoringDimensionsList
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
