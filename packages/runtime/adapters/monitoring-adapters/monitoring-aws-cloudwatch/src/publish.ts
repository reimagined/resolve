import CloudWatch from 'aws-sdk/clients/cloudwatch'
import { LeveledDebugger } from '@resolve-js/debug-levels'
import { retry } from 'resolve-cloud-common/utils'
import { MAX_METRIC_COUNT, MAX_VALUES_PER_METRIC } from './constants'
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

// TODO: any
const pushMetric = (metrics: any[], metric: any, dimensions: any) => {
  let valuesOffset = 0

  let values = metric.values.slice(
    valuesOffset,
    valuesOffset + MAX_VALUES_PER_METRIC
  )

  let counts = metric.counts.slice(
    valuesOffset,
    valuesOffset + MAX_VALUES_PER_METRIC
  )

  do {
    metrics.push({
      ...metric,
      values,
      counts,
      dimensions,
    })

    valuesOffset += MAX_VALUES_PER_METRIC

    values = metric.values.slice(
      valuesOffset,
      valuesOffset + MAX_VALUES_PER_METRIC
    )

    counts = metric.counts.slice(
      valuesOffset,
      valuesOffset + MAX_VALUES_PER_METRIC
    )
  } while (values.length > 0)
}

const createDurationDimensionList = ({
  deploymentId,
  resolveVersion,
}: {
  deploymentId: string
  resolveVersion: string
}) => [
  [{ name: 'DeploymentId', value: deploymentId }],
  [{ name: 'ResolveVersion', value: resolveVersion }],
  [
    { name: 'DeploymentId', value: deploymentId },
    { name: 'ResolveVersion', value: resolveVersion },
  ],
]

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
      if (
        metric.metricName === 'Errors' ||
        metric.metricName === 'Executions'
      ) {
        const {
          group: groupDimensions,
          error: errorDimensions,
          part: partName,
        } = metric.dimensions.reduce(
          // TODO: any
          (obj: any, dimension: any) => {
            if (['ErrorName', 'ErrorMessage'].includes(dimension.name)) {
              obj.error.push(dimension)
            } else {
              obj.group.push(dimension)

              if (dimension.name === 'Part' && obj.part == null) {
                obj.part = dimension.value
              }
            }

            return obj
          },
          {
            group: [],
            error: [],
            part: null,
          }
        )

        for (let i = 0; i < groupDimensions.length; i++) {
          const currentGroupDimensions = metric.dimensions.slice(0, i + 1)

          pushMetric(acc, metric, currentGroupDimensions)

          for (let j = 0; j < errorDimensions.length; j++) {
            pushMetric(
              acc,
              metric,
              currentGroupDimensions.concat(errorDimensions.slice(0, j + 1))
            )
          }
        }

        if (partName != null) {
          pushMetric(acc, metric, [{ name: 'Part', value: partName }])
        }
      } else if (metric.metricName === 'Duration') {
        const {
          deploymentId,
          version,
          other: dimensions,
        } = metric.dimensions.reduce(
          // TODO: any
          (obj: any, dimension: any) => {
            if (dimension.name === 'DeploymentId' && obj.deployment == null) {
              obj.deploymentId = dimension.value
            } else if (
              dimension.name === 'ResolveVersion' &&
              obj.version == null
            ) {
              obj.version = dimension.value
            } else {
              obj.other.push(dimension)
            }

            return obj
          },
          { deploymentId: null, version: null, other: [] }
        )

        const rootDimensionList = createDurationDimensionList({
          deploymentId,
          resolveVersion: version,
        })

        for (const rootDimensions of rootDimensionList) {
          pushMetric(acc, metric, rootDimensions.concat(dimensions))
        }
      } else {
        pushMetric(acc, metric, metric.dimensions)
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
