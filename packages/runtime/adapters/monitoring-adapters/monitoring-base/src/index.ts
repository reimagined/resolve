const createMonitoring = () => {
  const monitoringData = {
    // TODO: any
    metrics: [] as any[],
  }

  return {
    group: () => {},
    error: (error: Error) => {
      monitoringData.metrics.push({
        metricName: 'Errors',
        unit: 'count',
        timestamp: null,
        values: [1],
        counts: [1],
        dimensions: [
          { name: 'ErrorName', value: error.name },
          { name: 'ErrorMessage', value: error.message },
        ],
      })
    },
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
