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

const monitoringErrorCallback = async (log, data, error, part, meta) => {
  try {
    log.verbose(`Collect error for '${part}' part`)

    const metricData = buildExecutionMetricData(error, part, meta)

    if (metricData.length > 0) {
      data.metricData.push(...metricData)
    } else {
      log.verbose(`Unknown error part: ${part}`)
    }
  } catch (error) {
    log.verbose(`Failed to collect error`, error)
  }
}

const monitoringTimeCallback = async (
  log,
  data,
  name,
  timestamp = Date.now()
) => {
  if (typeof data.timerMap[name] !== 'number') {
    data.timerMap[name] = timestamp
  } else {
    log.warn(`Timer '${name}' already exists`)
  }
}

const monitoringTimeEndCallback = async (
  log,
  data,
  name,
  timestamp = Date.now()
) => {
  if (typeof data.timerMap[name] === 'number') {
    const duration = timestamp - data.timerMap[name]

    data.metricData.push(...buildDurationMetricData(name, duration))

    delete data.timerMap[name]
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

const createMonitoring = () => {
  const log = getLog('monitoring')

  const monitoringData = {
    timerMap: {},
    metricData: [],
  }

  return {
    error: monitoringErrorCallback.bind(null, log, monitoringData),
    time: monitoringTimeCallback.bind(null, log, monitoringData),
    timeEnd: monitoringTimeEndCallback.bind(null, log, monitoringData),
    publish: monitoringPublishCallback.bind(null, log, monitoringData),
  }
}

export default createMonitoring
