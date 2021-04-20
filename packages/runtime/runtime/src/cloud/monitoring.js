import CloudWatch from 'aws-sdk/clients/cloudwatch'
import debugLevels from '@resolve-js/debug-levels'

const getLog = (name) => debugLevels(`resolve:cloud:scheduler:${name}`)

const createErrorDimensionsList = (error) => [
  [
    { Name: 'ErrorName', Value: error.name },
    { Name: 'ErrorMessage', Value: error.message },
  ],
  [{ Name: 'ErrorName', Value: error.name }],
  [],
]

const monitoringErrorCallback = async (
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
          groupData.errorMetricDimensions.map((groupDimensions) =>
            groupDimensions.concat(errorDimensions)
          )
        ),
      []
    )

    const now = Date.now()

    monitoringData.metricData = monitoringData.metricData.concat(
      dimensionsList.map((dimensions) => ({
        MetricName: 'Errors',
        Timestamp: now,
        Unit: 'Count',
        Value: 1,
        Dimensions: dimensions,
      }))
    )
  } catch (error) {
    log.verbose(`Failed to collect error`, error)
  }
}

const monitoringTimeCallback = async (
  log,
  monitoringData,
  groupData,
  resolveVersion,
  name,
  timestamp = Date.now()
) => {
  if (!Number.isFinite(timestamp)) {
    log.warn(
      `Timer '${name}' is not started because timestamp must be a finite number`
    )
    return
  }

  if (typeof groupData.timerMap[name] !== 'number') {
    groupData.timerMap[name] = timestamp
  } else {
    log.warn(`Timer '${name}' already exists`)
  }
}

const monitoringTimeEndCallback = async (
  log,
  monitoringData,
  groupData,
  resolveVersion,
  name,
  timestamp = Date.now()
) => {
  if (!Number.isFinite(timestamp)) {
    log.warn(
      `Timer '${name}' is not ended because timestamp must be a finite number`
    )
    return
  }

  if (typeof groupData.timerMap[name] === 'number') {
    const duration = timestamp - groupData.timerMap[name]

    const durationDimensions = [{ Name: 'Label', Value: name }]
    const now = Date.now()

    const allDimensions = monitoringData.metricDimensions.map((dimensions) =>
      dimensions.concat(groupData.metricDimensions)
    )

    monitoringData.metricData = allDimensions.map((d) => ({
      MetricName: 'Duration',
      Timestamp: now,
      Unit: 'Milliseconds',
      Value: duration,
      Dimensions: d.concat(durationDimensions),
    }))

    delete groupData.timerMap[name]
  } else {
    log.warn(`Timer '${name}' does not exist`)
  }
}

const monitoringPublishCallback = async (log, monitoringData) => {
  try {
    log.verbose(`Sending ${monitoringData.metricData.length} metrics`)

    const cw = new CloudWatch()

    await cw
      .putMetricData({
        Namespace: 'RESOLVE_METRICS',
        MetricData: monitoringData.metricData,
      })
      .promise()

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

const createMonitoringImplementation = (
  log,
  monitoringData,
  groupData,
  resolveVersion
) => {
  return {
    group: (config) => {
      const groupDimensions = createGroupDimensions(config)

      const nextErrorMetricDimensions = groupData.errorMetricDimensions
        .map((dimensions) => dimensions.concat(groupDimensions))
        .concat(groupData.errorMetricDimensions)

      const nextGroupData = {
        timerMap: {},
        metricDimensions: groupData.metricDimensions.concat(groupDimensions),
        errorMetricDimensions: nextErrorMetricDimensions,
      }

      return createMonitoringImplementation(
        log,
        monitoringData,
        nextGroupData,
        resolveVersion
      )
    },
    error: monitoringErrorCallback.bind(null, log, monitoringData, groupData),
    time: monitoringTimeCallback.bind(
      null,
      log,
      monitoringData,
      groupData,
      resolveVersion
    ),
    timeEnd: monitoringTimeEndCallback.bind(
      null,
      log,
      monitoringData,
      groupData,
      resolveVersion
    ),
    publish: monitoringPublishCallback.bind(null, log, monitoringData),
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
    timerMap: {},
    metricData: [],
    metricDimensions: createDeploymentDimensions(deploymentId, resolveVersion),
    durationMetricDimensions: [
      [
        { Name: 'DeploymentId', Value: deploymentId },
        { Name: 'ResolveVersion', Value: resolveVersion },
      ],
      [{ Name: 'ResolveVersion', Value: resolveVersion }],
      [{ Name: 'DeploymentId', Value: deploymentId }],
    ],
    errorMetricDimensions: [[{ Name: 'DeploymentId', Value: deploymentId }]],
  }

  const monitoringGroupData = {
    timerMap: {},
    metricDimensions: [],
    durationMetricDimensions: monitoringData.durationMetricDimensions,
    errorMetricDimensions: monitoringData.errorMetricDimensions,
  }

  return createMonitoringImplementation(
    getLog('monitoring'),
    monitoringData,
    monitoringGroupData,
    // TODO: remove it
    resolveVersion
  )
}

export default createMonitoring
