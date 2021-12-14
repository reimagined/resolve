---
id: monitoring-adapter
title: Monitoring Adapter
description: This document describes the interface that a monitoring adapter should expose.
---

## Monitoring Adapter API

A monitoring adapter implementation should expose the following interface:

| Member Name                     | Description                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| [`error`](#error)               | Registers an occurred error.                                                               |
| [`execution`](#execution)       | Registers execution of an operation.                                                       |
| [`duration`](#duration)         | Registers duration of an operation.                                                        |
| [`time`](#time)                 | Starts execution time measurement.                                                         |
| [`timeEnd`](#timeend)           | Ends execution time measurement and registers the resulting duration.                      |
| [`publish`](#publish)           | Defined by an implementation, publishes the collected metrics to the intended destination. |
| [`rate`](#rate)                 | Registers operation execution rate during the specified time interval in seconds.          |
| [`group`](#group)               | Create a monitoring group.                                                                 |
| [`getMetrics`](#getmetrics)     | Get a list of collected metrics.                                                           |
| [`clearMetrics`](#clearmetrics) | Clear the list of collected metrics.                                                       |

All of the listed functions except for `publish` have a default implementation in the base package.

### `error`

Registers an occurred error. The default implementation increments the count of the `"Errors"` metric.

#### Arguments

| Argument Name | Type               | Descriptions                           |
| ------------- | ------------------ | -------------------------------------- |
| `error`       | An `error` object. | An error to add to monitoring metrics. |

### `execution`

Registers an execution of an operation. The default implementation increments the count of the `"Executions"` metric. The `execution` method can also be passed an optional `error` parameter. If this parameter is not `null`, the function registers the error in metrics.

#### Arguments

| Argument Name | Type                        | Descriptions                           |
| ------------- | --------------------------- | -------------------------------------- |
| `error?`      | An `error` object or `null` | An error to add to monitoring metrics. |

### `duration`

Registers the duration of an operation. The default implementation adds the specified value in milliseconds to the `"Duration"` metric.

#### Arguments

| Argument Name | Type     | Descriptions                                            |
| ------------- | -------- | ------------------------------------------------------- |
| `label`       | `string` | A text label to add to the 'Label' dimension.           |
| `duration`    | `number` | An operation duration in milliseconds.                  |
| `count?`      | `number` | A number to add to the metric's count. Defaults to `1`. |

### `time`

Starts a timer to measure execution time.

#### Arguments

| Argument Name | Type     | Descriptions                                                             |
| ------------- | -------- | ------------------------------------------------------------------------ |
| `name`        | `string` | The ID of the started timer.                                             |
| `timestamp?`  | `number` | A moment in time from which to start counting. Defaults to `Date.now()`. |

### `timeEnd`

Ends time measurement and registers the resulting duration. The default implementation adds the measured time value in milliseconds to the `"Duration"` metric.

#### Arguments

| Argument Name | Type     | Descriptions                                                          |
| ------------- | -------- | --------------------------------------------------------------------- |
| `name`        | `string` | The ID of the timer to stop.                                          |
| `timestamp?`  | `number` | A moment in time at which to stop counting. Defaults to `Date.now()`. |

### `publish`

Defined by an implementation, publishes the collected metrics to the intended destination.

#### Arguments

| Argument Name | Type     | Descriptions                                            |
| ------------- | -------- | ------------------------------------------------------- |
| `options?`    | `object` | Specifies additional options for the publish operation. |

#### Result

The returned value is a `promise` that resolves when the monitoring information is successfully published.

The monitoring adapters shipped with reSolve implement the `publish` function as follows:

| Module Name                             | Description                          |
| --------------------------------------- | ------------------------------------ |
| `@resolve-js/monitoring-console`        | Prints metrics to the text console.  |
| `@resolve-js/monitoring-aws-cloudwatch` | Publishes metrics to AWS CloudWatch. |

### `rate`

Registers operation execution rate during the specified time interval in seconds. The default implementation adds a value in times per N seconds to the specified metric.

| Argument Name | Type     | Descriptions                                                        |
| ------------- | -------- | ------------------------------------------------------------------- |
| `metricName`  | `string` | The name of the metric to add.                                      |
| `count`       | `number` | A number to add to the metric's count.                              |
| `seconds?`    | `number` | The number of seconds for which to count the rate. Defaults to `1`. |

### `group`

Creates a monitoring group and returns a monitoring adapter instance for this group.

| Argument Name | Type                       | Descriptions                                |
| ------------- | -------------------------- | ------------------------------------------- |
| `config`      | A key-value pair `object`. | A key-value pair that identifies the group. |

### `getMetrics`

Gets a list of collected metrics.

The returned value is an array of [`metric`](metric.md) objects.

### `clearMetrics`

Clear the list of collected metrics.

## Custom Monitoring Adapter Example

The code below demonstrates how to implement a monitoring that uses [Prometheus](https://prometheus.io/) to publish metrics.

The adapter implementation redefines the base adapter's `publish` function and reuses the default implementation for other API functions.

Note that Prometheus pulls metrics from an application through HTTP API calls. The implementation of an API handler that answers these calls is included.

```mdx-code-block
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
```

<Tabs>
<TabItem value="adapter" label="Adapter Implementation" default>

```js title="/common/prometheus-monitoring"
import client from 'prom-client'
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

let counter = null
let histogramDuration = null
let histogramFeedingRate = null

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
      const Registry = client.Registry

      const executionMetrics = {}
      const durationMetrics = {}
      const readModelsFeedingRate = {}
      const otherMetrics = []

      for (const metric of metrics) {
        const { dimensions, values, counts, unit, metricName } = metric
        if (metricName === 'Executions' && dimensions[0]?.name === 'Part') {
          const part = dimensions[0].value
          const register = new Registry()
          let gateway = new client.Pushgateway(
            'http://localhost:9091',
            [],
            register
          )

          if (executionMetrics[part] == null) {
            executionMetrics[part] = 0
          }

          for (let i = 0; i < counts.length; i++) {
            executionMetrics[part] += counts[i]
          }

          try {
            if (counter == null) {
              counter = new client.Counter({
                name: 'resolve_command_execution_on_push',
                help: 'Count of execute commands',
                labelNames: ['name', 'value'],
              })
            }
          } catch (error) {
            console.log('ERROR MONITORING', error.message)
          }

          register.registerMetric(counter)

          for (const dimension of dimensions) {
            counter.inc(dimension, executionMetrics[part])
          }
          gateway.pushAdd({ jobName: 'resolve_pushgateway' })
        } else if (
          metricName === 'Duration' &&
          dimensions[0]?.name === 'Part'
        ) {
          const part = dimensions[0].value

          const register = new Registry()
          let gateway = new client.Pushgateway(
            'http://localhost:9091',
            [],
            register
          )

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

          try {
            if (histogramDuration == null) {
              histogramDuration = new client.Histogram({
                name: 'resolve_command_duration_on_push',
                help: 'Duration of execute commands',
                labelNames: ['name', 'value'],
              })
            }
          } catch (error) {
            console.log('ERROR DURATION', error.message)
          }

          register.registerMetric(histogramDuration)

          for (const dimension of dimensions) {
            histogramDuration.labels(dimension).observe(10)
          }

          gateway.pushAdd({ jobName: 'resolve_pushgateway' })
        } else if (metricName === 'ReadModelFeedingRate') {
          let data = readModelsFeedingRate[dimensions[1].value]

          const register = new Registry()
          let gateway = new client.Pushgateway(
            'http://localhost:9091',
            [],
            register
          )

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

          if ((histogramFeedingRate = null)) {
            histogramFeedingRate = new client.Histogram({
              name: 'resolve_command_feeding_rate_on_push',
              help: 'Feeding rate of execute commands',
              labelNames: ['name', 'value'],
            })
          }

          register.registerMetric(histogramFeedingRate)

          for (const dimension of dimensions) {
            histogramFeedingRate.labels(dimension).observe(0.05)
          }

          gateway.pushAdd({ jobName: 'resolve_pushgateway' })
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
      })
      baseMonitoring.clearMetrics()
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
```

</TabItem>
<TabItem value="handler" label="Prometheus API Handler">

```js title="/common/api-handlers/prometheus-handler.js"
import client, { register } from 'prom-client'

let counter = null
let histogramDuration = null
let histogramRate = null
let histogramOtherMetrics = null
const prometheusHandler = async (req, res) => {
  const {
    resolve: { monitoring },
  } = req

  const metrics = monitoring.getMetrics('default')

  let inc = 0

  if (!metrics.metrics.length) {
    console.log('metrics has null')
  }

  for (const metric of metrics.metrics) {
    try {
      const { metricName, dimensions, values, counts, unit } = metric

      if (metricName === 'Executions') {
        if (counter == null) {
          counter = new client.Counter({
            name: 'resolve_command_execution',
            help: 'Count of execute commands',
            labelNames: ['name', 'value'],
          })
        }

        for (let i = 0; i < counts.length; i++) {
          inc += counts[i]
        }

        for (const dimension of dimensions) {
          counter.inc(dimension, inc)
        }
        inc = 0
      } else if (metricName == 'Duration') {
        if (histogramDuration == null) {
          histogramDuration = new client.Histogram({
            name: 'resolve_command_duration',
            help: 'Duration of execute commands',
            labelNames: ['name', 'value'],
          })
        }

        for (const dimension of dimensions) {
          histogramDuration.labels(dimension).observe(10)
        }
      } else if (metricName == 'ReadModelFeedingRate') {
        if (histogramRate == null) {
          histogramRate = new client.Histogram({
            name: 'resolve_command_feeding_rate',
            help: 'Feeding rate of execute commands',
            labelNames: ['name', 'value'],
          })
        }
        for (const dimension of dimensions) {
          histogramRate.labels(dimension).observe(10)
        }
      } else {
        if (histogramOtherMetrics == null) {
          histogramOtherMetrics = new client.Histogram({
            name: 'resolve_command_other',
            help: 'Other metrics',
            labelNames: ['name', 'value'],
          })
        }
        for (const dimension of dimensions) {
          histogramRate.labels(dimension).observe(10)
        }
      }
    } catch (error) {
      console.log('ERROR prometheusHandler', error)
    }
  }
  monitoring.clearMetrics('default')
  res.text(await register.metrics())
}

export default prometheusHandler
```

</TabItem>

<TabItem value="config" label="Application Configuration" default>

```js title="/config.app.js"
const appConfig = {
  ...
  monitoringAdapters: {
    monitoringAdapter: {
      module: '/common/prometheus-monitoring',
    },
  },
  apiHandlers: [
    {
      handler: '/common/api-handlers/prometheus-handler.js',
      path: '/metrics',
      method: 'GET',
    },
    ...
  ],
  ...
}
```

</TabItem>

</Tabs>
