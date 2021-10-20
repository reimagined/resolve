import createBaseMonitoring from '@resolve-js/monitoring-base'

const roundFloat = (number, exp = 2) =>
  Math.round(number * 10 ** exp) / 10 ** exp

const getLabelByDimensions = (dimensions, metricName) => {
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

const createMonitoringImplementation = (context, { baseMonitoring }) => {
  const monitoring = {
    group: (config) =>
      createMonitoringImplementation(context, {
        baseMonitoring: baseMonitoring.group(config),
      }),
    duration: baseMonitoring.duration.bind(baseMonitoring),
    error: baseMonitoring.error.bind(baseMonitoring),
    time: baseMonitoring.time.bind(baseMonitoring),
    timeEnd: baseMonitoring.timeEnd.bind(baseMonitoring),
    publish: async ({ source = 'resolveDispose' } = {}) => {
      const metrics = (baseMonitoring.getMetrics() ?? {}).metrics ?? []

      const executionMetrics = {}
      const durationMetrics = {}
      const readModelsFeedingRate = {}
      const otherMetrics = []
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
        } else if (
          metricName === 'Duration' &&
          dimensions[0]?.name === 'Part'
        ) {
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
      const executionsRows = Object.keys(executionMetrics).map((part) => ({
        name: `${part} executions`,
        count: executionMetrics[part],
      }))

      const durationRows = Object.keys(durationMetrics).map((part) => ({
        name: `${part} duration`,
        average: roundFloat(
          durationMetrics[part].sum / durationMetrics[part].count
        ),
        min: durationMetrics[part].min,
        max: durationMetrics[part].max,
        count: durationMetrics[part].count,
      }))

      const readModelsFeedingRateRows = Object.keys(readModelsFeedingRate).map(
        (readModel) => ({
          name: `"${readModel}" read model`,
          average: roundFloat(
            readModelsFeedingRate[readModel].sum /
              readModelsFeedingRate[readModel].count
          ),
          min: roundFloat(readModelsFeedingRate[readModel].min),
          max: roundFloat(readModelsFeedingRate[readModel].max),
          count: roundFloat(readModelsFeedingRate[readModel].count),
        })
      )

      // console.log('\n=== PUBLISH METRICS ===')

      const splittedMetrics = metrics.reduce(
        (acc, { metricName, unit, dimensions, values, counts }) => {
          if (metricName === 'Duration') {
            metricName = `${dimensions[0].value} Duration`
          }

          let item = acc.find((i) => i.metricName === metricName)

          if (item == null) {
            item = {
              metricName,
              unit,
              metrics: [],
            }

            acc.push(item)
          }

          const label = getLabelByDimensions(dimensions, metricName)
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
        []
      )

      splittedMetrics.forEach((item) => {
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

        // console.log(`- ${item.metricName} (${item.unit}) -`)
        // console.table(metricRows)
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
    },
    execution: baseMonitoring.execution.bind(baseMonitoring),
    rate: baseMonitoring.rate.bind(baseMonitoring),
    getMetrics: baseMonitoring.getMetrics.bind(baseMonitoring),
    clearMetrics: baseMonitoring.clearMetrics.bind(baseMonitoring),
  }

  return monitoring
}

const createMonitoring = () => {
  const baseMonitoring = createBaseMonitoring()

  return createMonitoringImplementation({ baseMonitoring }, { baseMonitoring })
}

export default createMonitoring
