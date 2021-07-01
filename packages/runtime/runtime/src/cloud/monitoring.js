import CloudWatch from 'aws-sdk/clients/cloudwatch'
import debugLevels from '@resolve-js/debug-levels'
import { retry } from 'resolve-cloud-common/utils'

const MAX_DIMENSION_VALUE_LENGTH = 256
const MAX_METRIC_COUNT = 20
const MAX_DIMENSION_COUNT = 10
const MAX_VALUES_PER_METRIC = 150

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

const monitoringError = async (log, monitoringData, groupData, error) => {
  try {
    log.verbose(`Collect error`)

    const dimensionsList = createErrorDimensionsList(error)
      .reduce(
        (acc, errorDimensions) =>
          acc.concat(
            groupData.errorMetricDimensionsList.map((groupDimensions) => [
              ...groupDimensions,
              ...errorDimensions,
            ])
          ),
        []
      )
      .concat(groupData.globalDimensions)

    const timestamp = new Date()
    timestamp.setMilliseconds(0)

    let isDimensionCountLimitReached = false

    monitoringData.metricData = monitoringData.metricData.concat(
      dimensionsList.reduce((acc, dimensions) => {
        if (dimensions.length <= MAX_DIMENSION_COUNT) {
          acc.push({
            MetricName: 'Errors',
            Timestamp: timestamp,
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
  duration,
  count = 1
) => {
  if (!Number.isFinite(duration)) {
    log.warn(
      `Duration '${label}' is not recorded because duration must be a finite number`
    )
    return
  }

  const durationDimensions = [{ Name: 'Label', Value: label }]
  const timestamp = new Date()
  timestamp.setMilliseconds(0)

  let isDimensionCountLimitReached = false

  for (const groupDimensions of groupData.durationMetricDimensionsList) {
    const dimensions = [...groupDimensions, ...durationDimensions]

    if (dimensions.length <= MAX_DIMENSION_COUNT) {
      const metricName = 'Duration'
      const time = timestamp.getTime()
      const unit = 'Milliseconds'

      const existingMetricData = monitoringData.metricData.find(
        (data) =>
          data.MetricName === metricName &&
          data.Unit === unit &&
          data.Timestamp.getTime() === time &&
          data.Dimensions.length === dimensions.length &&
          (data.Values.length < MAX_VALUES_PER_METRIC ||
            data.Values.includes(duration)) &&
          data.Dimensions.every(
            (dimension, index) =>
              dimension.Name === dimensions[index].Name &&
              dimension.Value === dimensions[index].Value
          )
      )

      if (existingMetricData != null) {
        let isValueFound = false

        for (let i = 0; i < existingMetricData.Values.length; i++) {
          if (existingMetricData.Values[i] === duration) {
            existingMetricData.Counts[i] += count
            isValueFound = true
            break
          }
        }

        if (!isValueFound) {
          existingMetricData.Values.push(duration)
          existingMetricData.Counts.push(count)
        }
      } else {
        monitoringData.metricData.push({
          MetricName: metricName,
          Timestamp: timestamp,
          Unit: unit,
          Values: [duration],
          Counts: [count],
          Dimensions: dimensions,
        })
      }
    } else {
      isDimensionCountLimitReached = true
    }
  }

  delete groupData.timerMap[label]

  if (isDimensionCountLimitReached) {
    log.warn(
      `Duration '${label}' missed some or all metric data because of dimension count limit`
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
    return monitoringDuration(log, monitoringData, groupData, label, duration)
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

const monitoringRate = async (
  log,
  monitoringData,
  groupData,
  metricName,
  count,
  seconds = 1
) => {
  if (!Number.isFinite(count)) {
    log.warn(
      `Count per second '${metricName}' is not recorded because count must be a finite number`
    )
    return
  }

  const timestamp = new Date()
  timestamp.setMilliseconds(0)

  let isDimensionCountLimitReached = false

  monitoringData.metricData = monitoringData.metricData.concat(
    groupData.durationMetricDimensionsList.reduce((acc, groupDimensions) => {
      if (groupDimensions.length <= MAX_DIMENSION_COUNT) {
        acc.push({
          MetricName: metricName,
          Timestamp: timestamp,
          Unit: 'Count/Second',
          Value: count / seconds,
          Dimensions: groupDimensions,
        })
      } else {
        isDimensionCountLimitReached = true
      }

      return acc
    }, [])
  )

  delete groupData.timerMap[metricName]

  if (isDimensionCountLimitReached) {
    log.warn(
      `Count per second '${metricName}' missed some or all metric data because of dimension count limit`
    )
  }
}

const createMonitoringImplementation = (log, monitoringData, groupData) => {
  return {
    group: (config) => {
      const groupDimensions = createGroupDimensions(config)

      const globalDimensions =
        config.Part != null ? [[{ Name: 'Part', Value: config.Part }]] : []

      const nextGroupData = {
        timerMap: {},
        globalDimensions: groupData.globalDimensions.concat(globalDimensions),
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
    duration: monitoringDuration.bind(null, log, monitoringData, groupData),
    time: monitoringTime.bind(null, log, monitoringData, groupData),
    timeEnd: monitoringTimeEnd.bind(null, log, monitoringData, groupData),
    rate: monitoringRate.bind(null, log, monitoringData, groupData),
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
    monitoringData,
    monitoringGroupData
  )
}

export default createMonitoring
