import { LeveledDebugger } from '@resolve-js/debug-levels'
import { createErrorDimensionsList } from './create-error-dimension-list'
import { MAX_DIMENSION_COUNT } from './constants'
import {
  MonitoringData,
  MonitoringGroupData,
  MonitoringMetricDatum,
  MonitoringDimensionsList,
} from './types'

export const monitoringError = async (
  log: LeveledDebugger,
  monitoringData: MonitoringData,
  groupData: MonitoringGroupData,
  error: Error
) => {
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
        [] as MonitoringDimensionsList
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
            Values: [1],
            Counts: [1],
            Dimensions: dimensions,
          })
        } else {
          isDimensionCountLimitReached = true
        }

        return acc
      }, [] as MonitoringMetricDatum[])
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
