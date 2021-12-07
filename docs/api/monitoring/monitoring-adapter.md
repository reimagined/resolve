---
id: monitoring-adapter
title: Monitoring Adapter
description: This document describes the interface that a monitoring adapter should expose.
---

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

The monitoring adapter shipped with reSolve implement the `publish` function as follows:

| Module Name                                                         | Description                          |
| ------------------------------------------------------------------- | ------------------------------------ |
| [@resolve-js/monitoring-console](#monitoring-console)               | Prints metrics to the text console.  |
| [@resolve-js/monitoring-aws-cloudwatch](#monitoring-aws-cloudwatch) | Publishes metrics to AWS CloudWatch. |

### `rate`

Registers operation execution rate during the specified time interval in seconds. The default implementation adds a in times per N seconds to the specified metric.

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
