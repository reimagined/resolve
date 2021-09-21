export interface MonitoringDimension {
  Name: string
  Value: string
}

export type MonitoringDimensions = MonitoringDimension[]
export type MonitoringDimensionsList = MonitoringDimensions[]

export interface MonitoringMetricDatum {
  MetricName: string
  Dimensions: MonitoringDimension[]
  Timestamp: Date
  Values: number[]
  Counts: number[]
  Unit: string
}

export interface MonitoringData {
  metricData: MonitoringMetricDatum[]
  metricDimensions: MonitoringDimensionsList
}

export interface MonitoringGroupData {
  timerMap: Record<string, number>
  metricDimensions: MonitoringDimensions
  globalDimensions: MonitoringDimensionsList
  durationMetricDimensionsList: MonitoringDimensionsList
  errorMetricDimensionsList: MonitoringDimensionsList
}
