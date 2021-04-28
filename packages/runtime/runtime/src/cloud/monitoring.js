import CloudWatch from 'aws-sdk/clients/cloudwatch'
import debugLevels from '@resolve-js/debug-levels'
import { retry } from 'resolve-cloud-common/utils'

const MAX_DIMENSION_VALUE_LENGTH = 256
const MAX_METRIC_COUNT = 20
const MAX_DIMENSION_COUNT = 10

const getLog = (name) => debugLevels(`resolve:cloud:${name}`)

const getErrorMessage = (error) => {
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

const createErrorDimensionsList = (error) => [
  [
    { Name: 'ErrorName', Value: error.name },
    { Name: 'ErrorMessage', Value: getErrorMessage(error) },
  ],
  [{ Name: 'ErrorName', Value: error.name }],
  [],
]

const monitoringError = async (
  log,
  monitoringData,
  groupData,
  error
) => {
  try {
    log.verbose(`Collect error`)

    const dimensionsList = createErrorDimensionsList(error).reduce(
      (acc, errorDimensions) =>
        acc.concat(
          groupData.errorMetricDimensionsList.map((groupDimensions) => [
            ...groupDimensions,
            ...errorDimensions,
          ])
        ),
      []
    )

    const now = new Date()
    let isDimensionCountLimitReached = false

    monitoringData.metricData = monitoringData.metricData.concat(
      dimensionsList.reduce((acc, dimensions) => {
        if (dimensions.length <= MAX_DIMENSION_COUNT) {
          acc.push({
            MetricName: 'Errors',
            Timestamp: now,
            Unit: 'Count',
            Value: 1,
            Dimensions: dimensions,
          })
        } else {
          isDimensionCountLimitReached = true
        }

        return acc
      }, [])
    )

    if (isDimensionCountLimitReached) {
      log.warn(
        `Error collecting missed some or all metric data because of dimension count limit`
      )
    }
  } catch (error) {
    log.verbose(`Failed to collect error`, error)
  }
}

const monitoringDuration = async (
  log,
  monitoringData,
  groupData,
  label,
  duration
) => {
  if (!Number.isFinite(duration)) {
    log.warn(
      `Duration '${label}' is not recorded because duration must be a finite number`
    )
    return
  }

  const durationDimensions = [{ Name: 'Label', Value: label }]
  const now = new Date()

  let isDimensionCountLimitReached = false

  monitoringData.metricData = monitoringData.metricData.concat(
    groupData.durationMetricDimensionsList.reduce((acc, groupDimensions) => {
      const dimensions = [...groupDimensions, ...durationDimensions]

      if (dimensions.length <= MAX_DIMENSION_COUNT) {
        acc.push({
          MetricName: 'Duration',
          Timestamp: now,
          Unit: 'Milliseconds',
          Value: duration,
          Dimensions: [...groupDimensions, ...durationDimensions],
        })
      } else {
        isDimensionCountLimitReached = true
      }

      return acc
    }, [])
  )

  delete groupData.timerMap[label]

  if (isDimensionCountLimitReached) {
    log.warn(
      `Timer '${label}' missed some or all metric data because of dimension count limit`
    )
  }
}

const monitoringTime = async (
  log,
  monitoringData,
  groupData,
  label,
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
  log,
  monitoringData,
  groupData,
  label,
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
    return monitoringDuration(
      log,
      monitoringData,
      groupData,
      label,
      duration
    )
  } else {
    log.warn(`Timer '${label}' does not exist`)
  }
}

const monitoringPublish = async (log, monitoringData) => {
  try {
    log.verbose(`Sending ${monitoringData.metricData.length} metrics`)
    log.verbose(JSON.stringify(monitoringData.metricData))

    const promises = []

    const cw = new CloudWatch()
    const putMetricData = retry(cw, cw.putMetricData)

    for (
      let i = 0;
      i < monitoringData.metricData.length;
      i += MAX_METRIC_COUNT
    ) {
      promises.push(
        putMetricData({
          Namespace: 'RESOLVE_METRICS',
          MetricData: monitoringData.metricData.slice(i, i + MAX_METRIC_COUNT),
        })
      )
    }

    monitoringData.metricData = []

    await Promise.all(promises)

    log.verbose(`Metrics data sent`)
  } catch (e) {
    log.warn(`Metrics data sending failed: ${e}`)
  }
}

const createGroupDimensions = (config) =>
  Object.keys(config).reduce(
    (acc, key) =>
      config[key] != null
        ? acc.concat({
            Name: key,
            Value: config[key],
          })
        : acc,
    []
  )

const createMonitoringImplementation = (log, monitoringData, groupData) => {
  return {
    group: (config) => {
      const groupDimensions = createGroupDimensions(config)

      const nextGroupData = {
        timerMap: {},
        metricDimensions: groupData.metricDimensions.concat(groupDimensions),
        durationMetricDimensionsList: groupData.durationMetricDimensionsList.map(
          (dimensions) => [...dimensions, ...groupDimensions]
        ),
        errorMetricDimensionsList: [
          ...groupData.errorMetricDimensionsList,
          groupData.errorMetricDimensionsList[
            groupData.errorMetricDimensionsList.length - 1
          ].concat(groupDimensions),
        ],
      }

      return createMonitoringImplementation(log, monitoringData, nextGroupData)
    },
    error: monitoringError.bind(null, log, monitoringData, groupData),
    duration: monitoringDuration.bind(
      null,
      log,
      monitoringData,
      groupData
    ),
    time: monitoringTime.bind(null, log, monitoringData, groupData),
    timeEnd: monitoringTimeEnd.bind(
      null,
      log,
      monitoringData,
      groupData
    ),
    publish: monitoringPublish.bind(null, log, monitoringData),
  }
}

const createDeploymentDimensions = (deploymentId, resolveVersion) => [
  [
    { Name: 'DeploymentId', Value: deploymentId },
    { Name: 'ResolveVersion', Value: resolveVersion },
  ],
  [{ Name: 'ResolveVersion', Value: resolveVersion }],
  [{ Name: 'DeploymentId', Value: deploymentId }],
]

const createMonitoring = ({ deploymentId, resolveVersion }) => {
  const monitoringData = {
    metricData: [],
    metricDimensions: createDeploymentDimensions(deploymentId, resolveVersion),
  }

  const monitoringGroupData = {
    timerMap: {},
    metricDimensions: [],
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
    monitoringData,
    monitoringGroupData
  )
}

export default createMonitoring
