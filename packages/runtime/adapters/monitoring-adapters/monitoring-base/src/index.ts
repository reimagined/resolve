// TODO: any
const areDimensionsEqual = (left: any[], right: any[]) => {
  if (left.length !== right.length) {
    return false
  }

  for (let i = 0; i < left.length; i++) {
    if (left[i].name !== right[i].name || left[i].value !== right[i].value) {
      return false
    }
  }

  return true
}

// TODO: any
const monitoringError = (log: any, monitoringData: any, error: Error) => {
  const errorDimensions = [
    { name: 'ErrorName', value: error.name },
    { name: 'ErrorMessage', value: error.message },
  ]

  const sameMetric = monitoringData.metrics.find(
    // TODO: any
    (metric: any) =>
      metric.metricName === 'Errors' &&
      metric.unit === 'count' &&
      metric.timestamp === null &&
      areDimensionsEqual(metric.dimensions, errorDimensions)
  )

  if (sameMetric == null) {
    monitoringData.metrics.push({
      metricName: 'Errors',
      unit: 'count',
      timestamp: null,
      values: [1],
      counts: [1],
      dimensions: errorDimensions,
    })
  } else {
    let isFound = false

    for (let i = 0; i < sameMetric.values.length; i++) {
      if (sameMetric.values[i] === 1) {
        sameMetric.counts[i]++
        isFound = true
        break
      }
    }

    if (!isFound) {
      sameMetric.values.push(1)
      sameMetric.counts.push(1)
    }
  }
}

const createMonitoring = () => {
  const monitoringData = {
    // TODO: any
    metrics: [] as any[],
  }

  return {
    group: () => {},
    error: monitoringError.bind(null, {}, monitoringData),
    execution: () => {},
    duration: () => {},
    time: () => {},
    timeEnd: () => {},
    rate: () => {},
    publish: () => {},
    getMetrics: () => monitoringData,
  }
}

export default createMonitoring
