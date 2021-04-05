import debugLevels from '@resolve-js/debug-levels'

import {
  putCommandMetrics,
  putReadModelProjectionMetrics,
  putReadModelResolverMetrics,
  putViewModelProjectionMetrics,
  putViewModelResolverMetrics,
  putApiHandlerMetrics,
  putSagaMetrics,
} from './metrics'

const getLog = (name) => debugLevels(`resolve:cloud:scheduler:${name}`)

const monitoringErrorCallback = async (log, data, error, part, meta) => {
  try {
    log.verbose(`Collect error for '${part}' part`)

    switch (part) {
      case 'command': {
        await putCommandMetrics(
          meta.command.aggregateName,
          meta.command.type,
          meta.command.aggregateId,
          error
        )
        break
      }
      case 'readModelProjection': {
        await putReadModelProjectionMetrics(
          meta.readModelName,
          meta.eventType,
          error
        )
        break
      }
      case 'readModelResolver': {
        await putReadModelResolverMetrics(
          meta.readModelName,
          meta.resolverName,
          error
        )
        break
      }
      case 'viewModelProjection': {
        await putViewModelProjectionMetrics(
          meta.viewModelName,
          meta.eventType,
          error
        )
        break
      }
      case 'viewModelResolver': {
        await putViewModelResolverMetrics(meta.readModelName, error)
        break
      }
      case 'apiHandler': {
        await putApiHandlerMetrics(meta.path, error)
        break
      }
      case 'sagaProjection': {
        await putSagaMetrics(meta.sagaName, meta.eventType, error)
        break
      }
      default: {
        log.verbose(`Unknown error part: ${part}`)
        break
      }
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
  timestamp = Date.now(),
) => {
  if (typeof data.timerMap[name] === 'number') {
    const duration = timestamp - data.timerMap[name]

    // TODO: replace by put metrics
    // eslint-disable-next-line no-console
    console.log(`${name}: ${duration} ms`)

    delete data.timerMap[name]
  } else {
    log.warn(`Timer '${name}' does not exist`)
  }
}

const monitoringSendSummaryCallback = async (log, metricData) => {
  try {
    log.verbose(`Metrics data sending`)
    // TODO: replace by put metrics
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(metricData, null, 2))
    log.verbose(`Metrics data sent`)
  } catch (e) {
    log.warn(`Metrics data sending failed: ${e}`)
  }
}

const initMonitoring = (resolve) => {
  const log = getLog('monitoring')

  const metricData = {
    timerMap: {},
  }

  resolve.monitoring = {
    error: monitoringErrorCallback.bind(null, log, metricData),
    time: monitoringTimeCallback.bind(null, log, metricData),
    timeEnd: monitoringTimeEndCallback(null, log, metricData),
    sendMetrics: monitoringSendSummaryCallback.bind(null, log, metricData),
  }
}

export default initMonitoring
