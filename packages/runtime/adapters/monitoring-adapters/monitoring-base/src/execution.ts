import { LeveledDebugger } from '@resolve-js/debug-levels'
import { createErrorDimensionsList } from './create-error-dimension-list'
import { MAX_DIMENSION_COUNT } from './constants'
import {
  MonitoringData,
  MonitoringGroupData,
  MonitoringDimensionsList,
} from './types'

export const monitoringExecution = async (
  log: LeveledDebugger,
  monitoringData: MonitoringData,
  groupData: MonitoringGroupData,
  error?: Error
) => {
  try {
    log.verbose(`Collect execution`)

    const executionDimensionList = groupData.errorMetricDimensionsList.concat(
      groupData.globalDimensions
    )

    let errorDimensionList = executionDimensionList
    let errorValue = 0

    if (error != null) {
      errorValue = 1

      errorDimensionList = createErrorDimensionsList(error)
        .reduce(
          (acc, errorDimensions) =>
            acc.concat(
              groupData.errorMetricDimensionsList.map((groupDimensions) => [
                ...groupDimensions,
                ...errorDimensions,
              ])
            ),
          [] as MonitoringDimensionsList
        )
        .concat(groupData.globalDimensions)
    }

    const timestamp = new Date()
    timestamp.setMilliseconds(0)

    let isDimensionCountLimitReached = false

    for (const dimensions of executionDimensionList) {
      if (dimensions.length <= MAX_DIMENSION_COUNT) {
        monitoringData.metricData.push({
          MetricName: 'Executions',
          Timestamp: timestamp,
          Unit: 'Count',
          Values: [1],
          Counts: [1],
          Dimensions: dimensions,
        })
      } else {
        isDimensionCountLimitReached = true
      }
    }

    for (const dimensions of errorDimensionList) {
      if (dimensions.length <= MAX_DIMENSION_COUNT) {
        monitoringData.metricData.push({
          MetricName: 'Errors',
          Timestamp: timestamp,
          Unit: 'Count',
          Values: [errorValue],
          Counts: [1],
          Dimensions: dimensions,
        })
      } else {
        isDimensionCountLimitReached = true
      }
    }

    if (isDimensionCountLimitReached) {
      log.warn(
        `Error collecting missed some or all metric data because of dimension count limit`
      )
    }
  } catch (error) {
    log.verbose(`Failed to collect execution`, error)
  }
}
