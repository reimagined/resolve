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
        const {
          group: groupDimensions,
          error: errorDimensions,
          part: partName,
        } = metric.dimensions.reduce(
          // TODO: any
          (acc: any, dimension: any) => {
            if (['ErrorName', 'ErrorMessage'].includes(dimension.name)) {
              acc.error.push(dimension)
            } else {
              acc.group.push(dimension)

              if (dimension.name === 'Part' && acc.part == null) {
                acc.part = dimension.value
              }
            }

            return acc
          },
          {
            group: [],
            error: [],
            part: null,
          }
        )

        for (let i = 0; i < groupDimensions.length; i++) {
          const currentGroupDimensions = metric.dimensions.slice(0, i + 1)

          acc.push({
            ...metric,
            dimensions: currentGroupDimensions,
          })

          for (let j = 0; j < errorDimensions.length; j++) {
            acc.push({
              ...metric,
              dimensions: currentGroupDimensions.concat(
                errorDimensions.slice(0, j + 1)
              ),
            })
          }
        }

        if (partName != null) {
          acc.push({
            ...metric,
            dimensions: [{ name: 'Part', value: partName }],
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
