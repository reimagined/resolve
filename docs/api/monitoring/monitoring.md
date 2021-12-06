---
id: monitoring
title: Monitoring Interface
---

A monitoring object's interface doubles the interface of a monitoring adapter except for the `getMetrics` and `clearMetrics` methods that require a monitoring adapted ID as an argument.

A monitoring object exposes the following API:

| Member Name                     | Description                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| [`error`](#error)               | Registers an occurred error                                                                |
| [`execution`](#execution)       | Registers an execution of an operation.                                                    |
| [`duration`](#duration)         | Registers the duration of an operation.                                                    |
| [`time`](#time)                 | Starts execution time measurement.                                                         |
| [`timeEnd`](#timeend)           | Ends execution time measurement and registers the resulting duration.                      |
| [`publish`](#publish)           | Defined by an implementation, publishes the collected metrics to the intended destination. |
| [`rate`](#rate)                 | Registers operation execution rate during the specified time interval in seconds.          |
| [`group`](#group)               | Create a monitoring group.                                                                 |
| [`getMetrics`](#getmetrics)     | Get a list of collected metrics.                                                           |
| [`clearMetrics`](#clearmetrics) | Clear the list of collected metrics.                                                       |

### `error`

### `execution`

### `duration`

### `time`

### `timeEnd`

### `publish`

### `rate`

### `performance`

### `group`

### `getMetrics`

### `clearMetrics`
