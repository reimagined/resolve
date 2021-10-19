import debugLevels, { LeveledDebugger } from '@resolve-js/debug-levels'

import type {
  MonitoringContext,
  MonitoringGroupContext,
  MonitoringDimension,
  MonitoringMetric,
} from './types'

export type { MonitoringDimension, MonitoringMetric }

const createErrorDimensions = (error: Error) => [
  { name: 'ErrorName', value: error.name },
  { name: 'ErrorMessage', value: error.message },
]

const areDimensionsEqual = (
  left: MonitoringDimension[],
  right: MonitoringDimension[]
) => {
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

const putMetric = (
  log: LeveledDebugger,
  monitoringContext: MonitoringContext,
  groupContext: MonitoringGroupContext,
  metricItem: Omit<MonitoringMetric, 'timestamp' | 'values' | 'counts'> & {
    value: number
    count: number
  }
) => {
  try {
    log.verbose(`Collecting metric`)

    const timestamp = monitoringContext.getTimestamp()

    let foundMetric = monitoringContext.metrics.find(
      (metric) =>
        metric.metricName === metricItem.metricName &&
        metric.timestamp === timestamp &&
        metric.unit === metricItem.unit &&
        areDimensionsEqual(metric.dimensions, metricItem.dimensions)
    )

    if (foundMetric != null) {
      let isValueFound = false

      for (let i = 0; i < foundMetric.values.length; i++) {
        if (foundMetric.values[i] === metricItem.value) {
          foundMetric.counts[i] += metricItem.count
          isValueFound = true
          break
        }
      }

      if (!isValueFound) {
        foundMetric.values.push(metricItem.value)
        foundMetric.counts.push(metricItem.count)
      }
    } else {
      monitoringContext.metrics.push({
        metricName: metricItem.metricName,
        timestamp,
        unit: metricItem.unit,
        dimensions: metricItem.dimensions,
        values: [metricItem.value],
        counts: [metricItem.count],
      })
    }
  } catch (error) {
    log.verbose(`Failed to collect metric`)
    log.verbose(error)
  }
}

const monitoringError = (
  log: LeveledDebugger,
  monitoringContext: MonitoringContext,
  groupContext: MonitoringGroupContext,
  error: Error
) => {
  putMetric(log, monitoringContext, groupContext, {
    metricName: 'Errors',
    unit: 'Count',
    dimensions: groupContext.dimensions.concat(createErrorDimensions(error)),
    value: 1,
    count: 1,
  })
}

const monitoringExecution = (
  log: LeveledDebugger,
  monitoringContext: MonitoringContext,
  groupContext: MonitoringGroupContext,
  error?: Error
) => {
  putMetric(log, monitoringContext, groupContext, {
    metricName: 'Executions',
    unit: 'Count',
    dimensions: groupContext.dimensions,
    value: 1,
    count: 1,
  })

  if (error != null) {
    putMetric(log, monitoringContext, groupContext, {
      metricName: 'Errors',
      unit: 'Count',
      dimensions: groupContext.dimensions.concat(createErrorDimensions(error)),
      value: 1,
      count: 1,
    })
  }
}

const monitoringDuration = (
  log: LeveledDebugger,
  monitoringContext: MonitoringContext,
  groupContext: MonitoringGroupContext,
  label: string,
  duration: number,
  count = 1
) => {
  if (!Number.isFinite(duration)) {
    log.warn(
      `Duration '${label}' is not recorded because duration must be a finite number`
    )
    return
  }

  putMetric(log, monitoringContext, groupContext, {
    metricName: 'Duration',
    unit: 'Milliseconds',
    dimensions: groupContext.dimensions.concat({ name: 'Label', value: label }),
    value: duration,
    count,
  })
}

const monitoringTime = (
  log: LeveledDebugger,
  monitoringContext: MonitoringContext,
  groupContext: MonitoringGroupContext,
  label: string,
  timestamp = Date.now()
) => {
  if (!Number.isFinite(timestamp)) {
    log.warn(
      `Timer '${label}' is not started because timestamp must be a finite number`
    )
    return
  }

  if (typeof groupContext.timerMap[label] !== 'number') {
    groupContext.timerMap[label] = timestamp
  } else {
    log.warn(`Timer '${label}' already exists`)
  }
}

const monitoringTimeEnd = (
  log: LeveledDebugger,
  monitoringContext: MonitoringContext,
  groupContext: MonitoringGroupContext,
  label: string,
  timestamp = Date.now()
) => {
  if (!Number.isFinite(timestamp)) {
    log.warn(
      `Timer '${label}' is not ended because timestamp must be a finite number`
    )
    return
  }

  if (typeof groupContext.timerMap[label] === 'number') {
    const duration = timestamp - groupContext.timerMap[label]
    delete groupContext.timerMap[label]

    return monitoringDuration(
      log,
      monitoringContext,
      groupContext,
      label,
      duration
    )
  } else {
    log.warn(`Timer '${label}' does not exist`)
  }
}

const createGroupDimensions = (config: Record<string, string>) =>
  Object.keys(config).reduce(
    (acc, key) =>
      config[key] != null
        ? acc.concat({
            name: key,
            value: config[key],
          })
        : acc,
    [] as MonitoringDimension[]
  )

const monitoringRate = (
  log: LeveledDebugger,
  monitoringContext: MonitoringContext,
  groupContext: MonitoringGroupContext,
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

  putMetric(log, monitoringContext, groupContext, {
    metricName,
    unit: 'Count/Second',
    dimensions: groupContext.dimensions,
    value: count / seconds,
    count: 1,
  })
}

const getMetrics = (
  log: LeveledDebugger,
  monitoringContext: MonitoringContext
): { metrics: MonitoringMetric[] } => ({
  metrics: monitoringContext.metrics.map((metric) => ({
    ...metric,
    dimensions: metric.dimensions.map((dimension) => ({
      ...dimension,
    })),
    values: metric.values.concat(),
    counts: metric.counts.concat(),
  })),
})

const clearMetrics = (
  log: LeveledDebugger,
  monitoringContext: MonitoringContext
) => {
  monitoringContext.metrics = []
}

const createMonitoringImplementation = (
  log: LeveledDebugger,
  monitoringContext: MonitoringContext,
  groupContext: MonitoringGroupContext
) => {
  return {
    group: (config: Record<string, string>) =>
      createMonitoringImplementation(log, monitoringContext, {
        timerMap: {},
        dimensions: groupContext.dimensions.concat(
          createGroupDimensions(config)
        ),
      }),
    error: monitoringError.bind(null, log, monitoringContext, groupContext),
    execution: monitoringExecution.bind(
      null,
      log,
      monitoringContext,
      groupContext
    ),
    duration: monitoringDuration.bind(
      null,
      log,
      monitoringContext,
      groupContext
    ),
    time: monitoringTime.bind(null, log, monitoringContext, groupContext),
    timeEnd: monitoringTimeEnd.bind(null, log, monitoringContext, groupContext),
    rate: monitoringRate.bind(null, log, monitoringContext, groupContext),
    getMetrics: getMetrics.bind(null, log, monitoringContext),
    clearMetrics: clearMetrics.bind(null, log, monitoringContext),
  }
}

const createMonitoring = ({
  getTimestamp = () => null,
}: { getTimestamp?: () => number | null } = {}) =>
  createMonitoringImplementation(
    debugLevels(`resolve-monitoring-base`),
    {
      getTimestamp: getTimestamp,
      metrics: [],
    },
    {
      timerMap: {},
      dimensions: [],
    }
  )

export default createMonitoring
