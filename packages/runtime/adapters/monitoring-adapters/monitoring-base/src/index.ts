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
      metric.unit === 'Count' &&
      metric.timestamp === null &&
      areDimensionsEqual(metric.dimensions, errorDimensions)
  )

  if (sameMetric == null) {
    monitoringData.metrics.push({
      metricName: 'Errors',
      unit: 'Count',
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

// TODO: refactoring implementation method for creating metrics
// const createMetric = (context: any, label: any, duration: any) => {


// }

// TODO: any, deduplicate values
const monitoringDuration = (log: any, monitoringData: any, label: any, duration: any) => {
  if (monitoringData.metrics.length === 0) {
    monitoringData.metrics.push({
      metricName: 'Duration',
      timestamp: null,
      unit: 'Milliseconds',
      values: [duration],
      counts: [1],
      dimensions: [{ name: 'Label', value: label}],
    })
  } else {
    for (let i = 0; i < monitoringData.metrics.length; i++){
      let isFound = false

      monitoringData.metrics[i].dimensions.push({ name: 'Label', value: label})
      for (let j = 0; j < monitoringData.metrics[i].values.length; j++) {
        if(monitoringData.metrics[i].values[j] === duration) {
          monitoringData.metrics[i].counts[j]++
          isFound = true
          break
        }
      }

      if (!isFound){
        monitoringData.metrics[i].values.push(duration)
        monitoringData.metrics[i].counts.push(1)
      }
    }  
  }
}

const monitoringExecution = (log: any, monitoringData: any, groupData: any) => {
  monitoringData.metrics.push({
    metricName: 'Execution',
    timestamp: null,
    unit: 'Count',
    values: [1],
    counts: [1],
    dimensions: groupData.metricDimensions,
  })
}

// TODO: any, deduplicate values
const monitoringRate = (log: any, monitoringData: any, metricName: string, count: number, seconds = 1) => {
  monitoringData.metrics.push({
    metricName: metricName,
    timestamp: null,
    unit: 'Count/Second',
    values: [count / seconds],
    counts: [1],
    dimensions: null,
  })
}

const createGroupDimensions = (config: Record<string, string>) =>
  Object.keys(config).reduce(
    (acc, key) =>
      config[key] != null
        ? acc.concat({
            Name: key,
            Value: config[key],
          })
        : acc,
    [] as any
  )

const createBaseMonitoringImplementation = (monitoringData: any, groupData: any) => {
  return {
    group: (config: Record<string, string>) => {
      const groupDimensions = createGroupDimensions(config)
      const nextGroupDimension = {
        metricDimensions: groupData.metricDimensions.concat(groupDimensions),
      }
       
      return createBaseMonitoringImplementation(monitoringData, nextGroupDimension)
    },
    error: monitoringError.bind(null, {}, monitoringData),
    execution: monitoringExecution.bind(null, {}, monitoringData, groupData),
    duration: monitoringDuration.bind(null, {}, monitoringData),
    time: () => {},
    timeEnd: () => {},
    rate: monitoringRate.bind(null, {}, monitoringData),
    publish: () => {},
    getMetrics: () => monitoringData,
    clearMetrics: () => monitoringData.metrics = [] 
  }
}

const createBaseMonitoring = () => {
  const monitoringData = {
    // TODO: any
    metrics: [] as any[],
  }

  const monitoringGroupData = {
    metricDimensions: [],
  }
  return createBaseMonitoringImplementation(monitoringData, monitoringGroupData)
}

export default createBaseMonitoring
