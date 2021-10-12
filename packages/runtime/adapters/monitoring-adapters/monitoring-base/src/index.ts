import CloudWatch from 'aws-sdk/clients/cloudwatch'
import debugLevels from '@resolve-js/debug-levels'
import { retry } from 'resolve-cloud-common/utils'

const MAX_DIMENSION_VALUE_LENGTH = 256
const MAX_METRIC_COUNT = 20
const MAX_DIMENSION_COUNT = 10
const MAX_VALUES_PER_METRIC = 150

const getLog = (name: string) => debugLevels(`resolve:cloud:${name}`)

const getErrorMessage = (error: Error) => {
  let errorMessage = error.message.split(/\n|\r|\r\n/g)[0]

  if (errorMessage.length > MAX_DIMENSION_VALUE_LENGTH) {
    const messageEnd = '...'

    errorMessage = `${errorMessage.slice(
      0,
      MAX_DIMENSION_VALUE_LENGTH - messageEnd.length
    )}${messageEnd}`
  }

  return errorMessage
}

const createErrorDimensions = (error: Error) => [
  { name: 'ErrorName', value: error.name },
  { name: 'ErrorMessage', value: getErrorMessage(error) },
]

const createErrorDimensionsList = (error: Error) => [
  [
    { name: 'ErrorName', value: error.name },
    { name: 'ErrorMessage', value: getErrorMessage(error) },
  ],
  [{ name: 'ErrorName', value: error.name }],
  [],
]

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

// @ts-ignore
const putMetric = (log, monitoringContext, groupData, metric) => {
  try {
    log.verbose(`Collecting metric`)

    const timestamp = monitoringContext.getTimestamp()

    let foundMetric = monitoringContext.metrics.find(
      (m: any) =>
        m.metricName === metric.metricName &&
        m.timestamp === timestamp &&
        m.unit === metric.unit &&
        areDimensionsEqual(m.dimensions, metric.dimensions)
    )

    if (foundMetric != null) {
      let isValueFound = false

      for (let i = 0; i < foundMetric.values.length; i++) {
        if (foundMetric.values[i] === metric.value) {
          foundMetric.counts[i] += metric.count
          isValueFound = true
          break
        }
      }

      if (!isValueFound) {
        foundMetric.values.push(metric.value)
        foundMetric.counts.push(metric.count)
      }
    } else {
      monitoringContext.metrics.push({
        metricName: metric.metricName,
        timestamp,
        unit: metric.unit,
        dimensions: metric.dimensions,
        values: [metric.value],
        counts: [metric.count],
      })
    }
  } catch (error) {
    log.verbose(`Failed to collect metric`)
    log.verbose(error)
  }
}

// @ts-ignore
const monitoringError = async (log, monitoringContext, groupData, error) => {
  putMetric(log, monitoringContext, groupData, {
    metricName: 'Errors',
    unit: 'Count',
    dimensions: groupData.dimensions.concat(createErrorDimensions(error)),
    value: 1,
    count: 1,
  })
}

const monitoringExecution = async (
  log: any,
  monitoringContext: {
    metricData: {
      MetricName: string
      Timestamp: Date
      Unit: string
      Value: number
      Dimensions: any
    }[]
  },
  groupData: any,
  error?: Error
) => {
  putMetric(log, monitoringContext, groupData, {
    metricName: 'Executions',
    unit: 'Count',
    dimensions: groupData.dimensions,
    value: 1,
    count: 1,
  })

  if (error != null) {
    putMetric(log, monitoringContext, groupData, {
      metricName: 'Errors',
      unit: 'Count',
      dimensions: groupData.dimensions.concat(createErrorDimensions(error)),
      value: 1,
      count: 1,
    })
  }
}

const monitoringDuration = async (
  log: { warn: (arg0: string) => void },
  monitoringContext: any,
  groupData: any,
  label: string | number,
  duration: unknown,
  count = 1
) => {
  if (!Number.isFinite(duration)) {
    log.warn(
      `Duration '${label}' is not recorded because duration must be a finite number`
    )
    return
  }

  putMetric(log, monitoringContext, groupData, {
    metricName: 'Duration',
    unit: 'Milliseconds',
    dimensions: groupData.dimensions.concat({ name: 'Label', value: label }),
    value: duration,
    count,
  })
}

const monitoringTime = async (
  log: { warn: (arg0: string) => void },
  monitoringContext: any,
  groupData: { timerMap: { [x: string]: number } },
  label: string | number,
  timestamp = Date.now()
) => {
  if (!Number.isFinite(timestamp)) {
    log.warn(
      `Timer '${label}' is not started because timestamp must be a finite number`
    )
    return
  }

  if (typeof groupData.timerMap[label] !== 'number') {
    groupData.timerMap[label] = timestamp
  } else {
    log.warn(`Timer '${label}' already exists`)
  }
}

const monitoringTimeEnd = async (
  log: { warn: any },
  monitoringContext: {
    metricData: {
      MetricName: string
      Timestamp: Date
      Unit: string
      Values: any[]
      Counts: number[]
      Dimensions: any[]
    }[]
  },
  groupData: { timerMap: any; durationMetricDimensionsList?: any },
  label: string | number,
  timestamp = Date.now()
) => {
  if (!Number.isFinite(timestamp)) {
    log.warn(
      `Timer '${label}' is not ended because timestamp must be a finite number`
    )
    return
  }

  if (typeof groupData.timerMap[label] === 'number') {
    const duration = timestamp - groupData.timerMap[label]
    delete groupData.timerMap[label]
    // @ts-ignore
    return monitoringDuration(
      log,
      monitoringContext,
      groupData,
      label,
      duration
    )
  } else {
    log.warn(`Timer '${label}' does not exist`)
  }
}

// @ts-ignore
const monitoringPublish = async (log, monitoringContext) => {
  void log
  void monitoringContext
  // try {
  //   log.verbose(`Sending ${monitoringContext.metricData.length} metrics`)
  //   log.verbose(JSON.stringify(monitoringContext.metricData))
  //
  //   const promises = []
  //
  //   const cw = new CloudWatch()
  //   const putMetricData = retry(cw, cw.putMetricData)
  //
  //   for (
  //     let i = 0;
  //     i < monitoringContext.metricData.length;
  //     i += MAX_METRIC_COUNT
  //   ) {
  //     promises.push(
  //       putMetricData({
  //         Namespace: 'ResolveJs',
  //         MetricData: monitoringContext.metricData.slice(i, i + MAX_METRIC_COUNT),
  //       })
  //     )
  //   }
  //
  //   monitoringContext.metricData = []
  //
  //   await Promise.all(promises)
  //
  //   log.verbose(`Metrics data sent`)
  // } catch (e) {
  //   log.warn(`Metrics data sending failed: ${e}`)
  // }
}

// @ts-ignore
const createGroupDimensions = (config) =>
  Object.keys(config).reduce(
    (acc, key) =>
      config[key] != null
        ? acc.concat({
            name: key,
            value: config[key],
          })
        : acc,
    [] as any[]
  )

const monitoringRate = async (
  log: { warn: (arg0: string) => void },
  monitoringContext: any,
  groupData: any,
  metricName: string,
  count: number,
  seconds = 1
) => {
  if (!Number.isFinite(count)) {
    log.warn(
      `Count per second '${metricName}' is not recorded because count must be a finite number`
    )
    return
  }

  putMetric(log, monitoringContext, groupData, {
    metricName,
    timestamp: null,
    unit: 'Count/Second',
    dimensions: groupData.dimensions,
    value: count / seconds,
    count: 1,
  })
}

// @ts-ignore
const getMetrics = (log, monitoringContext) => {
  void log
  void monitoringContext
  return {
    metrics: monitoringContext.metrics,
  }
}

// @ts-ignore
const clearMetrics = (log, monitoringContext) => {
  void log
  void monitoringContext
  monitoringContext.metrics = []
}

// @ts-ignore
const createMonitoringImplementation = (log, monitoringContext, groupData) => {
  return {
    // @ts-ignore
    group: (config) => {
      const groupDimensions = createGroupDimensions(config)

      const globalDimensions =
        config.Part != null ? [[{ Name: 'Part', Value: config.Part }]] : []

      const nextGroupData = {
        timerMap: {},
        dimensions: groupData.dimensions.concat(createGroupDimensions(config)),
        globalDimensions: groupData.globalDimensions.concat(globalDimensions),
        metricDimensions: groupData.metricDimensions.concat(groupDimensions),
        durationMetricDimensionsList: groupData.durationMetricDimensionsList.map(
          // @ts-ignore
          (dimensions) => [...dimensions, ...groupDimensions]
        ),
        errorMetricDimensionsList: [
          ...groupData.errorMetricDimensionsList,
          groupData.errorMetricDimensionsList[
            groupData.errorMetricDimensionsList.length - 1
          ].concat(groupDimensions),
        ],
      }

      return createMonitoringImplementation(
        log,
        monitoringContext,
        nextGroupData
      )
    },
    error: monitoringError.bind(null, log, monitoringContext, groupData),
    execution: monitoringExecution.bind(
      null,
      log,
      monitoringContext,
      groupData
    ),
    duration: monitoringDuration.bind(null, log, monitoringContext, groupData),
    time: monitoringTime.bind(null, log, monitoringContext, groupData),
    timeEnd: monitoringTimeEnd.bind(null, log, monitoringContext, groupData),
    rate: monitoringRate.bind(null, log, monitoringContext, groupData),
    publish: monitoringPublish.bind(null, log, monitoringContext),
    getMetrics: getMetrics.bind(null, log, monitoringContext),
    clearMetrics: clearMetrics.bind(null, log, monitoringContext),
  }
}

const createDeploymentDimensions = (deploymentId: any, resolveVersion: any) => [
  [
    { Name: 'DeploymentId', Value: deploymentId },
    { Name: 'ResolveVersion', Value: resolveVersion },
  ],
  [{ Name: 'ResolveVersion', Value: resolveVersion }],
  [{ Name: 'DeploymentId', Value: deploymentId }],
]

const createMonitoring = ({
  getTimestamp = () => null,
}: { getTimestamp?: () => number | null } = {}) => {
  const deploymentId = 'temp'
  const resolveVersion = 'temp'

  const monitoringContext = {
    getTimestamp: getTimestamp,
    metrics: [],
    metricDimensions: createDeploymentDimensions(deploymentId, resolveVersion),
  }

  const monitoringGroupData = {
    timerMap: {},
    dimensions: [],
    metricDimensions: [],
    globalDimensions: [],
    durationMetricDimensionsList: [
      [
        { Name: 'DeploymentId', Value: deploymentId },
        { Name: 'ResolveVersion', Value: resolveVersion },
      ],
      [{ Name: 'ResolveVersion', Value: resolveVersion }],
      [{ Name: 'DeploymentId', Value: deploymentId }],
    ],
    errorMetricDimensionsList: [
      [{ Name: 'DeploymentId', Value: deploymentId }],
    ],
  }

  return createMonitoringImplementation(
    getLog('monitoring'),
    monitoringContext,
    monitoringGroupData
  )
}

export default createMonitoring
