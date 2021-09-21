import {Dimension, MetricData} from 'aws-sdk/clients/cloudwatch'

export type MonitoringMetricDimensions = Array<Array<Dimension>>

export interface MonitoringData {
  metricData: MetricData,
  metricDimensions: MonitoringMetricDimensions
}

export interface MonitoringGroupData {
  timerMap: Record<string, number>,
  metricDimensions: MonitoringMetricDimensions,
  globalDimensions: MonitoringMetricDimensions,
  durationMetricDimensionsList: MonitoringMetricDimensions,
  errorMetricDimensionsList: MonitoringMetricDimensions
}
