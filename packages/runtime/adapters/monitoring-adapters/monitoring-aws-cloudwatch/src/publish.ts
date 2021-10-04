import CloudWatch from 'aws-sdk/clients/cloudwatch'
import { LeveledDebugger } from '@resolve-js/debug-levels'
import { retry } from 'resolve-cloud-common/utils'
import { MAX_METRIC_COUNT } from './constants'
import { MonitoringData } from './types'

const baseUnitToCloudWatchUnit = {
  count: 'Count',
  milliseconds: 'Milliseconds',
}

// TODO: any
const baseMetricToCloudWatchMetric = (metric: any) => ({
  MetricName: metric.metricName,
  Unit:
    baseUnitToCloudWatchUnit[
      metric.unit as keyof typeof baseUnitToCloudWatchUnit
    ],
  Dimensions: metric.dimensions.map(({ name, value }: any) => ({
    Name: name,
    Value: value,
  })),
  Values: metric.values,
  Counts: metric.counts,
  Timestamp: new Date(metric.timestamp),
})

export const monitoringPublish = async (
  log: LeveledDebugger,
  monitoringData: MonitoringData
) => {
  const metricData = monitoringData.monitoringBase.getMetrics()
  log.verbose(`Sending ${metricData.metrics.length} metrics`)
  log.verbose(JSON.stringify(metricData.metrics))

  try {
    const promises = []

    const cw = new CloudWatch()
    const putMetricData = retry(cw, cw.putMetricData)

    // TODO: any
    const metrics = metricData.metrics.reduce((acc: any, metric: any) => {
      if (metric.metricName === 'Errors') {
        for (let i = 0; i < metric.dimensions.length; i++) {
          acc.push({
            ...metric,
            dimensions: metric.dimensions.slice(0, i + 1),
          })
        }
      } else {
        acc.push(metric)
      }

      return acc
    }, [])

    for (let i = 0; i < metrics.length; i += MAX_METRIC_COUNT) {
      promises.push(
        putMetricData({
          Namespace: 'ResolveJs',
          MetricData: metrics
            .slice(i, i + MAX_METRIC_COUNT)
            .map(baseMetricToCloudWatchMetric),
        })
      )
    }

    monitoringData.monitoringBase.clearMetrics()

    await Promise.all(promises)

    log.verbose(`Metrics data sent`)
  } catch (e) {
    log.warn(`Metrics data sending failed: ${e}`)
  }
}
