---
id: monitoring
title: Monitoring Interface
---

:::info TypeScript Support

A monitoring object has an associated TypeScript type:

- Type Name - `Monitoring`
- Package - `@resolve-js/core`

:::

A monitoring object's interface is the same as the interface of a monitoring adapter except for the [`getMetrics`](#getmetrics) and [`clearMetrics`](#clearmetrics) methods that require a monitoring adapter ID as an argument.

A monitoring object exposes the following API:

| Member Name                     | Description                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| [`error`](#error)               | Registers an occurred error.                                                               |
| [`execution`](#execution)       | Registers an execution of an operation.                                                    |
| [`duration`](#duration)         | Registers the duration of an operation.                                                    |
| [`time`](#time)                 | Starts execution time measurement.                                                         |
| [`timeEnd`](#timeend)           | Ends execution time measurement and registers the resulting duration.                      |
| [`custom`](#custom)             | Registers a custom metric.                                                                 |
| [`publish`](#publish)           | Defined by an implementation, publishes the collected metrics to the intended destination. |
| [`rate`](#rate)                 | Registers operation execution rate during the specified time interval in seconds.          |
| [`group`](#group)               | Creates a monitoring group.                                                                |
| [`getMetrics`](#getmetrics)     | Gets a list of collected metrics.                                                          |
| [`clearMetrics`](#clearmetrics) | Clears the list of collected metrics.                                                      |

### `error`

Registers an occurred error. The default implementation increments the count of the `"Errors"` metric.

#### Example

```js
try {
  ...
} catch (error) {
  monitoring.error(error)
}
```

#### Arguments

| Argument Name | Type               | Description                            |
| ------------- | ------------------ | -------------------------------------- |
| `error`       | An `error` object. | An error to add to monitoring metrics. |

### `execution`

Registers an operation's execution. The default implementation increments the count of the `"Executions"` metric. The `execution` method can also be passed an optional `error` parameter. If this parameter is not `null`, the function registers the error in metrics.

#### Example

```js
monitoring.execution()
```

#### Arguments

| Argument Name | Type                        | Description                            |
| ------------- | --------------------------- | -------------------------------------- |
| `error?`      | An `error` object or `null` | An error to add to monitoring metrics. |

### `duration`

Registers the duration of an operation. The default implementation adds the specified value in milliseconds to the `"Duration"` metric.

#### Example

```js
monitoring.duration(
  'myOperation',
  duration / operations.length,
  operations.length
)
```

#### Arguments

| Argument Name | Type     | Description                                             |
| ------------- | -------- | ------------------------------------------------------- |
| `label`       | `string` | A text label to add to the 'Label' dimension.           |
| `duration`    | `number` | An operation duration in milliseconds.                  |
| `count?`      | `number` | A number to add to the metric's count. Defaults to `1`. |

### `time`

Starts a timer to measure execution time.

#### Example

```js
monitoring.time('Execution', startTimestamp)
```

#### Arguments

| Argument Name | Type     | Description                                                              |
| ------------- | -------- | ------------------------------------------------------------------------ |
| `name`        | `string` | The ID of the started timer.                                             |
| `timestamp?`  | `number` | A moment in time from which to start counting. Defaults to `Date.now()`. |

### `timeEnd`

Ends time measurement and registers the resulting duration. The default implementation adds the measured time value in milliseconds to the `"Duration"` metric.

#### Example

```js
monitoring.timeEnd('Execution')
```

#### Arguments

| Argument Name | Type     | Description                                                           |
| ------------- | -------- | --------------------------------------------------------------------- |
| `name`        | `string` | The ID of the timer to stop.                                          |
| `timestamp?`  | `number` | A moment in time at which to stop counting. Defaults to `Date.now()`. |

### `custom`

Registers the specified custom metric. If the metric object's `value` and/or `count` fields are not specified, the default implementation sets them to `1`.

#### Example

```js
monitoring.custom(myMetric)
```

#### Arguments

| Argument Name | Type                                                      | Description                       |
| ------------- | --------------------------------------------------------- | --------------------------------- |
| `metricData`  | A [custom metric object](metric.md#custom-metric-object). | Specifies a custom metric's data. |

### `publish`

Defined by an implementation, publishes the collected metrics to the intended destination.

#### Example

```js
await monitoring.publish()
```

#### Arguments

| Argument Name | Type     | Description                                             |
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

#### Example

```js
monitoring.rate('ReadModelFeedingRate', eventCount, applyDuration / 1000)
```

#### Arguments

| Argument Name | Type     | Description                                                         |
| ------------- | -------- | ------------------------------------------------------------------- |
| `metricName`  | `string` | The name of the metric to add.                                      |
| `count`       | `number` | A number to add to the metric's count.                              |
| `seconds?`    | `number` | The number of seconds for which to count the rate. Defaults to `1`. |

### `group`

Creates a monitoring group and returns a monitoring adapter instance for this group.

#### Example

```js
const groupMonitoring = monitoring.group({ Part: 'ReadModel' })
```

#### Arguments

| Argument Name | Type                       | Description                                 |
| ------------- | -------------------------- | ------------------------------------------- |
| `config`      | A key-value pair `object`. | A key-value pair that identifies the group. |

#### Result

A monitoring object instance that operates on the created group.

### `getMetrics`

Gets a list of collected metrics.

#### Example

```js
const metrics = getMetrics('default')
```

| Argument Name | Type     | Description                                                           |
| ------------- | -------- | --------------------------------------------------------------------- |
| `id`          | `string` | The metrics adapter ID as specified in the application configuration. |

#### Result

The returned value is an array of [`metric`](metric.md) objects.

### `clearMetrics`

#### Example

```js
monitoring.clearMetrics('default')
```

Clear the list of collected metrics.

| Argument Name | Type     | Description                                                           |
| ------------- | -------- | --------------------------------------------------------------------- |
| `id`          | `string` | The metrics adapter ID as specified in the application configuration. |
