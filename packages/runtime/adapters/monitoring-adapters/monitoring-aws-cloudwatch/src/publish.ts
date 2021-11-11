import { LeveledDebugger } from '@resolve-js/debug-levels'
import { pureRequire } from '@resolve-js/runtime-base'

import type {
  MonitoringDimension,
  MonitoringData,
  MonitoringMetric,
} from '@resolve-js/core'

import {
  MAX_DIMENSION_VALUE_LENGTH,
  MAX_METRIC_COUNT,
  MAX_VALUES_PER_METRIC,
} from './constants'

import { MonitoringContext, CloudWatchMetricDatum } from './types'

const normalizeValue = (value: string) => {
  let result = value.split(/\n|\r|\r\n/g)[0]

  if (result.length > MAX_DIMENSION_VALUE_LENGTH) {
    const messageEnd = '...'

    result = `${result.slice(
      0,
      MAX_DIMENSION_VALUE_LENGTH - messageEnd.length
    )}${messageEnd}`
  }

  return result
}

const baseMetricToCloudWatchMetric = (
  metric: MonitoringMetric
): CloudWatchMetricDatum => ({
  MetricName: metric.metricName,
  Unit: metric.unit,
  Dimensions: metric.dimensions.map(({ name, value }) => ({
    Name: name,
    Value: normalizeValue(value),
  })),
  Values: metric.values,
  Counts: metric.counts,
  Timestamp: metric.timestamp != null ? new Date(metric.timestamp) : new Date(),
})

const pushMetric = (
  metrics: MonitoringMetric[],
  metric: MonitoringMetric,
  dimensions: MonitoringDimension[]
) => {
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
  context: MonitoringContext
) => {
  const metricData = context.monitoringBase.getMetrics() as MonitoringData
  log.verbose(`Sending ${metricData.metrics.length} metrics`)
  log.verbose(JSON.stringify(metricData.metrics))

  try {
    const promises = []
    let CloudWatch: any
    let retry: any
    try {
      void ({ CloudWatch } = pureRequire('aws-sdk/clients/cloudwatch'))
      void ({ retry } = pureRequire('resolve-cloud-common/utils'))
    } catch {}

    const cw = new CloudWatch()
    const putMetricData = retry(cw, cw.putMetricData)

    const metrics = metricData.metrics.reduce((acc, metric) => {
      if (
        metric.metricName === 'Errors' ||
        metric.metricName === 'Executions'
      ) {
        const deploymentDimensions = [
          { name: 'DeploymentId', value: context.deploymentId },
        ]

        const {
          group: groupDimensions,
          error: errorDimensions,
          part: partName,
        } = metric.dimensions.reduce(
          (obj, dimension) => {
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
          } as {
            group: MonitoringDimension[]
            error: MonitoringDimension[]
            part: string | null
          }
        )

        for (let i = 0; i < groupDimensions.length; i++) {
          const currentGroupDimensions = metric.dimensions.slice(0, i + 1)

          pushMetric(
            acc,
            metric,
            deploymentDimensions.concat(currentGroupDimensions)
          )

          for (let j = 0; j < errorDimensions.length; j++) {
            pushMetric(
              acc,
              metric,
              deploymentDimensions.concat(
                currentGroupDimensions,
                errorDimensions.slice(0, j + 1)
              )
            )
          }
        }

        for (let j = 0; j < errorDimensions.length; j++) {
          pushMetric(
            acc,
            metric,
            deploymentDimensions.concat(errorDimensions.slice(0, j + 1))
          )
        }

        pushMetric(acc, metric, deploymentDimensions)

        if (partName != null) {
          pushMetric(acc, metric, [{ name: 'Part', value: partName }])
        }
      } else {
        const rootDimensionList = createDurationDimensionList({
          deploymentId: context.deploymentId,
          resolveVersion: context.resolveVersion,
        })

        for (const rootDimensions of rootDimensionList) {
          pushMetric(acc, metric, rootDimensions.concat(metric.dimensions))
        }
      }

      return acc
    }, [] as MonitoringMetric[])

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

    context.monitoringBase.clearMetrics()

    await Promise.all(promises)

    log.verbose(`Metrics data sent`)
  } catch (e) {
    log.warn(`Metrics data sending failed: ${e}`)
  }
}
