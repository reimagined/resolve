import { LeveledDebugger } from '@resolve-js/debug-levels'
import { MAX_DIMENSION_COUNT } from './constants'
import { MonitoringData, MonitoringGroupData, MonitoringMetricDatum } from './types'

export const monitoringRate = async (
  log: LeveledDebugger,
  monitoringData: MonitoringData,
  groupData: MonitoringGroupData,
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
          Values: [count / seconds],
          Counts: [1],
          Dimensions: groupDimensions,
        })
      } else {
        isDimensionCountLimitReached = true
      }

      return acc
    }, [] as MonitoringMetricDatum[])
  )

  delete groupData.timerMap[metricName]

  if (isDimensionCountLimitReached) {
    log.warn(
      `Count per second '${metricName}' missed some or all metric data because of dimension count limit`
    )
  }
}
