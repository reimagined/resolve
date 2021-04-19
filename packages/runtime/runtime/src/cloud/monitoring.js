import CloudWatch from 'aws-sdk/clients/cloudwatch'
import debugLevels from '@resolve-js/debug-levels'

import {
  buildApiHandlerMetricData,
  buildSagaProjectionMetricData,
  buildCommandMetricData,
  buildReadModelProjectionMetricData,
  buildReadModelResolverMetricData,
  buildViewModelProjectionMetricData,
  buildViewModelResolverMetricData,
  buildInternalExecutionMetricData,
  buildDurationMetricData,
} from './metrics'

const getLog = (name) => debugLevels(`resolve:cloud:scheduler:${name}`)

const buildExecutionMetricData = (error, part, meta) => {
  switch (part) {
    case 'command': {
      return buildCommandMetricData(
        meta.command.aggregateName,
        meta.command.type,
        meta.command.aggregateId,
        error
      )
    }
    case 'readModelProjection': {
      return buildReadModelProjectionMetricData(
        meta.readModelName,
        meta.eventType,
        error
      )
    }
    case 'readModelResolver': {
      return buildReadModelResolverMetricData(
        meta.readModelName,
        meta.resolverName,
        error
      )
    }
    case 'viewModelProjection': {
      return buildViewModelProjectionMetricData(
        meta.viewModelName,
        meta.eventType,
        error
      )
    }
    case 'viewModelResolver': {
      return buildViewModelResolverMetricData(meta.viewModelName, error)
    }
    case 'apiHandler': {
      return buildApiHandlerMetricData(meta.path, error)
    }
    case 'sagaProjection': {
      return buildSagaProjectionMetricData(meta.sagaName, meta.eventType, error)
    }
    case 'internal': {
      return buildInternalExecutionMetricData(error)
    }
    default: {
      return []
    }
  }
}

const monitoringErrorCallback = async (
  log,
  monitoringData,
  groupData,
  resolveVersion,
  error,
  part,
  meta
) => {
  try {
    log.verbose(`Collect error for '${part}' part`)

    const metricData = buildExecutionMetricData(error, part, meta)

    if (metricData.length > 0) {
      monitoringData.metricData.push(...metricData)
    } else {
      log.verbose(`Unknown error part: ${part}`)
    }
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

    monitoringData.metricData = monitoringData.metricData.concat(
      groupData.metricDimensions.map((d) => ({
        MetricName: 'Duration',
        Timestamp: now,
        Unit: 'Milliseconds',
        Value: duration,
        Dimensions: d.concat(durationDimensions),
      }))
    )

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

const createMonitoringImplementation = (
  log,
  monitoringData,
  groupData,
  resolveVersion
) => {
  return {
    group: (config) => {
      const groupDimensions = Object.keys(config).reduce((acc, key) => {
        if (config[key] != null) {
          acc.push({
            Name: key,
            Value: config[key],
          })
        }

        return acc
      }, [])

      const nextGroupData = {
        timerMap: {},
        metricDimensions: groupData.metricDimensions.map((d) =>
          d.concat(groupDimensions)
        ),
      }

      return createMonitoringImplementation(
        log,
        monitoringData,
        nextGroupData,
        resolveVersion
      )
    },
    error: monitoringErrorCallback.bind(
      null,
      log,
      monitoringData,
      groupData,
      resolveVersion
    ),
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
    // metricDimensions: dimensions,
  }

  const monitoringGroupData = {
    timerMap: {},
    metricDimensions: createDeploymentDimensions(deploymentId, resolveVersion),
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
