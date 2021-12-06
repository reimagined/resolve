---
id: metric
title: Monitoring Metric
---

A monitoring metric object contains information about a particular metric collected during application execution. Metrics are stored and processed internally by monitoring adapters and can be accessed through a monitoring object's `getMetrics` method:

```js
const metrics = monitoring.getMetrics('default')
```

A metric object has the following structure:

```js
export interface MonitoringMetric {
  metricName: string
  dimensions: MonitoringDimension[]
  timestamp: number | null
  values: number[]
  counts: number[]
  unit: string
}
```
