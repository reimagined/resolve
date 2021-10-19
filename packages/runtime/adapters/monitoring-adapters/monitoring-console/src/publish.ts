import type { MonitoringDimension } from '@resolve-js/monitoring-base'
import { LeveledDebugger } from '@resolve-js/debug-levels'
import columnify from 'columnify'

import type { MonitoringContext } from './types'

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

export const monitoringPublish = async (
  log: LeveledDebugger,
  context: MonitoringContext
) => {
  const { metrics } = context.baseMonitoring.getMetrics()

  // TODO: any
  const executionMetrics: any = {}
  const durationMetrics: any = {}
  const readModelsFeedingRate: any = {}
  const otherMetrics: any = []

  for (const metric of metrics) {
    const { dimensions, values, counts, unit, metricName } = metric

    if (metricName === 'Executions' && dimensions[0]?.name === 'Part') {
      const part = dimensions[0].value

      if (executionMetrics[part] == null) {
        executionMetrics[part] = 0
      }

      for (let i = 0; i < counts.length; i++) {
        executionMetrics[part] += counts[i]
      }
    } else if (metricName === 'Duration' && dimensions[0]?.name === 'Part') {
      const part = dimensions[0].value

      if (durationMetrics[part] == null) {
        durationMetrics[part] = {
          sum: 0,
          count: 0,
          min: Infinity,
          max: -Infinity,
        }
      }

      for (let i = 0; i < values.length; i++) {
        durationMetrics[part].sum += values[i] * counts[i]
        durationMetrics[part].count += counts[i]
        durationMetrics[part].min = Math.min(
          durationMetrics[part].min,
          values[i]
        )
        durationMetrics[part].max = Math.max(
          durationMetrics[part].max,
          values[i]
        )
      }
    } else if (metricName === 'ReadModelFeedingRate') {
      let data = readModelsFeedingRate[dimensions[1].value]

      if (data == null) {
        data = {
          sum: 0,
          count: 0,
          min: Infinity,
          max: -Infinity,
        }

        readModelsFeedingRate[dimensions[1].value] = data
      }

      for (let i = 0; i < values.length; i++) {
        data.sum += values[i] * counts[i]
        data.count += counts[i]
        data.min = Math.min(data.min, values[i])
        data.max = Math.max(data.max, values[i])
      }
    } else {
      otherMetrics.push(metric)
    }
  }

  // const executionsRows = Object.keys(executionMetrics).map((part) => ({
  //   name: `${part} executions`,
  //   count: executionMetrics[part],
  // }))
  //
  // const durationRows = Object.keys(durationMetrics).map((part) => ({
  //   name: `${part} duration`,
  //   average: parseFloat((
  //     durationMetrics[part].sum / durationMetrics[part].count
  //   ).toFixed(2)),
  //   min: durationMetrics[part].min,
  //   max: durationMetrics[part].max,
  //   count: durationMetrics[part].count,
  // }))

  // const readModelsFeedingRateRows = Object.keys(readModelsFeedingRate).map(
  //   (readModel) => ({
  //     name: `"${readModel}" read model`,
  //     average: roundFloat(
  //       readModelsFeedingRate[readModel].sum /
  //       readModelsFeedingRate[readModel].count
  //     ),
  //     min: roundFloat(readModelsFeedingRate[readModel].min),
  //     max: roundFloat(readModelsFeedingRate[readModel].max),
  //     count: roundFloat(readModelsFeedingRate[readModel].count),
  //   })
  // )

  log.verbose('\n=== PUBLISH METRICS ===')

  const splittedMetrics = metrics.reduce(
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

      const label = getLabelByDimensions(dimensions, metricName)
      // TODO: any
      let itemMetric = item.metrics.find((i: any) => i.label === label)

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
    // TODO: any
    [] as any[]
  )

  splittedMetrics.forEach((item) => {
    // TODO: any
    const metricRows = item.metrics.map(({ label, values, counts }: any) => {
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

    log.verbose(`- ${item.metricName} (${item.unit}) -`)
    log.verbose(columnify(metricRows))
  })

  // if (executionsRows.length > 0) {
  //   console.log('- Executions -')
  //   console.table(executionsRows)
  // }
  //
  // if (durationRows.length > 0) {
  //   console.log('- Duration -')
  //   console.table(durationRows)
  // }
  //
  // if (readModelsFeedingRateRows.length > 0) {
  //   console.log('- Read models feeding rate -')
  //   console.table(readModelsFeedingRateRows)
  // }
  //
  // if (otherMetrics.length > 0) {
  //   console.log(JSON.stringify(otherMetrics, null, 2))
  // }

  // baseMonitoring.clearMetrics()
}
