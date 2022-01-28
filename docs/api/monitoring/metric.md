---
id: metric
title: Monitoring Metric
---

## Metric Object

A monitoring metric object contains information about a particular metric collected during application execution. Metrics are stored and processed internally by monitoring adapters and can be accessed through a monitoring object's `getMetrics` method:

```js
const metrics = monitoring.getMetrics('default')
```

A metric object has the following structure:

```js
{
  metricName, // The name of a metric.
  dimensions, // An array of monitoring dimensions.
  timestamp,  // The time at which the metric was last updated.
  values,     // An array of the metric's values.
  counts,     // An array of the metric's counts.
  unit,       // The name of the measurment unit.
}
```

## Custom Metric Object

A custom metric object is used to bass metric data to the `metrics.custom()` method. This object has the following structure:

```js
{
  metricName, // The name of a metric.
  dimensions, // An array of monitoring dimensions.
  values,     // An array of the metric's values.
  counts,     // An array of the metric's counts.
  unit,       // The name of the measurment unit.
}
```
