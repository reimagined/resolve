import type {
  MonitoringDimension,
  MonitoringMetric,
} from '@resolve-js/core'
import { LeveledDebugger } from '@resolve-js/debug-levels'
import columnify from 'columnify'

import type { MonitoringContext, MetricsGroup, MetricSummary } from './types'

// eslint-disable-next-line no-console
const printLogs = (output: string) => console.log(output)

const getLabelByDimensions = (
  dimensions: MonitoringDimension[],
  metricName: string
) => {
  if (metricName.includes(' Duration')) {
    return dimensions[dimensions.length - 1].value
  }

  if (metricName === 'Executions') {
    return dimensions[0].value
  }

  if (metricName === 'ReadModelFeedingRate') {
    return dimensions[1].value
  }

  return dimensions.map(({ name, value }) => `${name}="${value}"`).join(', ')
}

const createInitialSummary = (): MetricSummary => ({
  sum: 0,
  count: 0,
  min: Infinity,
  max: -Infinity,
})

const addValuesToMetricSummary = (
  summary: MetricSummary,
  { values, counts }: { values: number[]; counts: number[] }
) => {
  for (let i = 0; i < values.length; i++) {
    summary.sum += values[i] * counts[i]
    summary.count += counts[i]
    summary.min = Math.min(summary.min, values[i])
    summary.max = Math.max(summary.max, values[i])
  }
}

export const monitoringPublish = async (
  log: LeveledDebugger,
  context: MonitoringContext,
  { source = 'resolveDispose' } = {}
) => {
  if (source !== 'processExit') {
    log.verbose(`Monitoring is not published for ${source} source`)
    return
  }

  const { metrics } = context.baseMonitoring.getMetrics()

  const executionMetrics: { [key: string]: number } = {}

  const durationMetrics: {
    [key: string]: MetricSummary
  } = {}

  const readModelsFeedingRate: {
    [key: string]: MetricSummary
  } = {}

  const otherMetrics: MonitoringMetric[] = []

  for (const metric of metrics) {
    const { dimensions, values, counts, metricName } = metric

    if (metricName === 'Executions' && dimensions[0]?.name === 'Part') {
      const part = dimensions[0].value

      if (executionMetrics[part] == null) {
        executionMetrics[part] = 0
      }

      for (let i = 0; i < values.length; i++) {
        executionMetrics[part] += values[i] * counts[i]
      }
    } else if (metricName === 'Duration' && dimensions[0]?.name === 'Part') {
      const part = dimensions[0].value

      if (durationMetrics[part] == null) {
        durationMetrics[part] = createInitialSummary()
      }

      addValuesToMetricSummary(durationMetrics[part], metric)
    } else if (metricName === 'ReadModelFeedingRate') {
      let data = readModelsFeedingRate[dimensions[1].value]

      if (data == null) {
        data = createInitialSummary()
        readModelsFeedingRate[dimensions[1].value] = data
      }

      addValuesToMetricSummary(
        readModelsFeedingRate[dimensions[1].value],
        metric
      )
    } else {
      otherMetrics.push(metric)
    }
  }

  printLogs('\n=== PUBLISH METRICS ===')

  const groupedMetrics = metrics.reduce(
    (acc, { metricName, unit, dimensions, values, counts }) => {
      let name = metricName

      if (metricName === 'Duration') {
        name = `${dimensions[0].value} Duration`
      }

      let item = acc.find((i) => i.metricName === name)

      if (item == null) {
        item = {
          metricName: name,
          unit,
          metrics: [],
        }

        acc.push(item)
      }

      const label = getLabelByDimensions(dimensions, name)
      let itemMetric = item.metrics.find((i) => i.label === label)

      if (itemMetric == null) {
        item.metrics.push({
          label,
          values,
          counts,
        })
      } else {
        itemMetric.values.push(...values)
        itemMetric.counts.push(...counts)
      }

      return acc
    },
    [] as MetricsGroup[]
  )

  groupedMetrics.forEach((item) => {
    const metricRows = item.metrics.map(({ label, values, counts }) => {
      let sum = 0
      let count = 0
      let min = Infinity
      let max = -Infinity

      for (let i = 0; i < values.length; i++) {
        sum += values[i] * counts[i]
        count += counts[i]
        min = Math.min(min, values[i])
        max = Math.max(max, values[i])
      }

      if (item.unit === 'Count') {
        return {
          label,
          count,
        }
      }

      return {
        label,
        avg: parseFloat((sum / count).toFixed(2)),
        min: parseFloat(min.toFixed(2)),
        max: parseFloat(max.toFixed(2)),
        count,
      }
    })

    printLogs(`\n- ${item.metricName} (${item.unit}) -\n`)

    printLogs(
      columnify(metricRows, {
        columnSplitter: ' | ',
      })
    )

    if (otherMetrics.length > 0) {
      printLogs(`\n- Other metrics -\n`)
      printLogs(JSON.stringify(otherMetrics, null, 2))
    }
  })
}
