import { LeveledDebugger } from '@resolve-js/debug-levels'
import { MAX_DIMENSION_COUNT, MAX_VALUES_PER_METRIC } from './constants'

import { MonitoringData, MonitoringGroupData } from './types'

export const monitoringDuration = async (
  log: LeveledDebugger,
  monitoringData: MonitoringData,
  groupData: MonitoringGroupData,
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
